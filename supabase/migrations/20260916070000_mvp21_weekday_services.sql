-- Clínica NS — MVP 2.1
-- Adds per-weekday service availability without changing existing appointments.
-- Every weekday starts in `all` mode so this migration preserves the MVP 2 behavior.

create table public.weekday_service_rules (
  weekday smallint primary key check (weekday between 1 and 7),
  mode text not null default 'all' check (mode in ('all', 'selected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekday_service_selections (
  weekday smallint not null references public.weekday_service_rules(weekday) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (weekday, service_id)
);

create trigger weekday_service_rules_set_updated_at
before update on public.weekday_service_rules
for each row execute function public.set_updated_at();

insert into public.weekday_service_rules (weekday, mode)
select weekday, 'all'
from generate_series(1, 7) as weekday
on conflict (weekday) do nothing;

alter table public.weekday_service_rules enable row level security;
alter table public.weekday_service_selections enable row level security;

create policy "admins manage weekday service rules"
on public.weekday_service_rules for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage weekday service selections"
on public.weekday_service_selections for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.save_weekday_service_rule(
  p_weekday smallint,
  p_mode text,
  p_service_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  if p_weekday not between 1 and 7 then
    raise exception using errcode = '22023', message = 'invalid_weekday';
  end if;

  if p_mode not in ('all', 'selected') then
    raise exception using errcode = '22023', message = 'invalid_weekday_service_mode';
  end if;

  insert into public.weekday_service_rules (weekday, mode)
  values (p_weekday, p_mode)
  on conflict (weekday) do update set mode = excluded.mode;

  delete from public.weekday_service_selections
  where weekday = p_weekday;

  if p_mode = 'selected' then
    insert into public.weekday_service_selections (weekday, service_id)
    select p_weekday, requested.service_id
    from (
      select distinct unnest(coalesce(p_service_ids, '{}'::uuid[])) as service_id
    ) requested
    join public.services service on service.id = requested.service_id
    where service.active;
  end if;
end;
$$;

revoke all on function public.save_weekday_service_rule(smallint, text, uuid[]) from public;
grant execute on function public.save_weekday_service_rule(smallint, text, uuid[]) to authenticated;

-- Correct the MVP 2 phone constraint for formatted Brazilian numbers.
alter table public.appointments
  drop constraint if exists appointments_customer_phone_check;

alter table public.appointments
  add constraint appointments_customer_phone_check
  check (char_length(regexp_replace(customer_phone, '[^0-9]', '', 'g')) between 10 and 13);

create or replace function public.get_available_slots(
  p_service_id uuid,
  p_date date
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  label text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with selected_service as (
    select service.duration_minutes
    from public.services service
    where service.id = p_service_id
      and service.active
      and coalesce(
        (
          select rule.mode = 'all'
            or exists (
              select 1
              from public.weekday_service_selections selection
              where selection.weekday = rule.weekday
                and selection.service_id = service.id
            )
          from public.weekday_service_rules rule
          where rule.weekday = extract(isodow from p_date)::smallint
        ),
        true
      )
  ),
  settings as (
    select slot_interval_minutes
    from public.booking_settings
    where singleton
  ),
  candidates as (
    select
      generated_at as starts_at,
      generated_at + make_interval(mins => service.duration_minutes) as ends_at
    from public.business_hours hours
    cross join selected_service service
    cross join settings
    cross join lateral generate_series(
      (p_date + hours.start_time)::timestamp at time zone 'America/Sao_Paulo',
      ((p_date + hours.end_time)::timestamp at time zone 'America/Sao_Paulo')
        - make_interval(mins => service.duration_minutes),
      make_interval(mins => settings.slot_interval_minutes)
    ) generated_at
    where hours.active
      and hours.weekday = extract(isodow from p_date)::smallint
      and p_date >= (now() at time zone 'America/Sao_Paulo')::date
  )
  select
    candidate.starts_at,
    candidate.ends_at,
    to_char(candidate.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI') as label
  from candidates candidate
  where candidate.starts_at > now()
    and not exists (
      select 1
      from public.blocked_periods blocked
      where tstzrange(blocked.starts_at, blocked.ends_at, '[)')
        && tstzrange(candidate.starts_at, candidate.ends_at, '[)')
    )
    and not exists (
      select 1
      from public.appointments appointment
      where appointment.status = 'confirmed'
        and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
          && tstzrange(candidate.starts_at, candidate.ends_at, '[)')
    )
  order by candidate.starts_at;
$$;

revoke all on function public.get_available_slots(uuid, date) from public;
grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;

create or replace function private.create_appointment_internal(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text,
  p_source text
)
returns table (
  appointment_id uuid,
  service_name text,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  selected_service public.services%rowtype;
  calculated_end timestamptz;
  local_start timestamp;
  local_end timestamp;
  created_id uuid;
  service_allowed boolean;
begin
  perform pg_advisory_xact_lock(hashtext('clinica-ns-schedule'));

  if char_length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception using errcode = '22023', message = 'invalid_customer_name';
  end if;

  if char_length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g')) not between 10 and 13 then
    raise exception using errcode = '22023', message = 'invalid_customer_phone';
  end if;

  if char_length(coalesce(p_customer_notes, '')) > 500 then
    raise exception using errcode = '22023', message = 'notes_too_long';
  end if;

  select * into selected_service
  from public.services
  where id = p_service_id and active
  for share;

  if not found then
    raise exception using errcode = '22023', message = 'service_inactive';
  end if;

  if p_starts_at <= now() then
    raise exception using errcode = '22023', message = 'past_slot';
  end if;

  calculated_end := p_starts_at + make_interval(mins => selected_service.duration_minutes);
  local_start := p_starts_at at time zone 'America/Sao_Paulo';
  local_end := calculated_end at time zone 'America/Sao_Paulo';

  select coalesce(
    (
      select rule.mode = 'all'
        or exists (
          select 1
          from public.weekday_service_selections selection
          where selection.weekday = rule.weekday
            and selection.service_id = selected_service.id
        )
      from public.weekday_service_rules rule
      where rule.weekday = extract(isodow from local_start)::smallint
    ),
    true
  ) into service_allowed;

  if not service_allowed then
    raise exception using errcode = '22023', message = 'service_unavailable_on_weekday';
  end if;

  if local_start::date <> local_end::date or not exists (
    select 1
    from public.business_hours hours
    cross join public.booking_settings settings
    where hours.active
      and settings.singleton
      and hours.weekday = extract(isodow from local_start)::smallint
      and local_start::time >= hours.start_time
      and local_end::time <= hours.end_time
      and mod(
        (extract(epoch from (local_start::time - hours.start_time)) / 60)::integer,
        settings.slot_interval_minutes
      ) = 0
  ) then
    raise exception using errcode = '22023', message = 'outside_business_hours';
  end if;

  if exists (
    select 1 from public.blocked_periods blocked
    where tstzrange(blocked.starts_at, blocked.ends_at, '[)')
      && tstzrange(p_starts_at, calculated_end, '[)')
  ) then
    raise exception using errcode = '22023', message = 'blocked_period';
  end if;

  if exists (
    select 1 from public.appointments appointment
    where appointment.status = 'confirmed'
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
        && tstzrange(p_starts_at, calculated_end, '[)')
  ) then
    raise exception using errcode = '23P01', message = 'slot_conflict';
  end if;

  begin
    insert into public.appointments (
      service_id,
      customer_name,
      customer_phone,
      customer_notes,
      starts_at,
      ends_at,
      source
    ) values (
      selected_service.id,
      trim(p_customer_name),
      trim(p_customer_phone),
      nullif(trim(coalesce(p_customer_notes, '')), ''),
      p_starts_at,
      calculated_end,
      p_source
    ) returning id into created_id;
  exception when exclusion_violation then
    raise exception using errcode = '23P01', message = 'slot_conflict';
  end;

  return query
  select created_id, selected_service.name, p_starts_at, calculated_end;
end;
$$;

revoke all on function private.create_appointment_internal(uuid, timestamptz, text, text, text, text) from public;

grant select on public.weekday_service_rules to authenticated;
grant select on public.weekday_service_selections to authenticated;

comment on table public.weekday_service_rules is 'Per-weekday service mode. `all` automatically includes services created later.';
comment on table public.weekday_service_selections is 'Explicit services offered when a weekday uses `selected` mode.';
