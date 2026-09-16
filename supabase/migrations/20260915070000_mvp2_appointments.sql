-- Clínica NS — MVP 2
-- PostgreSQL/Supabase is the authoritative layer for availability, authorization
-- and appointment concurrency. All timestamps are stored as timestamptz (UTC)
-- and converted with the explicit America/Sao_Paulo business timezone.

create schema if not exists private;
revoke create on schema public from public, anon, authenticated;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 300),
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_hours_valid_range check (start_time < end_time),
  constraint business_hours_unique_interval unique (weekday, start_time, end_time)
);

create table public.booking_settings (
  singleton boolean primary key default true check (singleton),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 5 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete restrict,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  customer_phone text not null check (char_length(regexp_replace(customer_phone, '\\D', '', 'g')) between 10 and 13),
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 500),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  source text not null default 'online' check (source in ('online', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_range check (starts_at < ends_at)
);

create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  constraint blocked_periods_valid_range check (starts_at < ends_at)
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.appointments
  add constraint appointments_no_confirmed_overlap
  exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed');

create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_service_id_idx on public.appointments (service_id);
create index blocked_periods_starts_at_idx on public.blocked_periods (starts_at);
create index services_active_idx on public.services (active);
create index business_hours_weekday_idx on public.business_hours (weekday) where active;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger business_hours_set_updated_at
before update on public.business_hours
for each row execute function public.set_updated_at();

create trigger booking_settings_set_updated_at
before update on public.booking_settings
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.admin_users where user_id = auth.uid()
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.booking_settings enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.admin_users enable row level security;

create policy "admins manage services"
on public.services for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage business hours"
on public.business_hours for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage booking settings"
on public.booking_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage appointments"
on public.appointments for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage blocked periods"
on public.blocked_periods for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin();
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.list_active_services()
returns table (
  id uuid,
  name text,
  description text,
  duration_minutes integer,
  active boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.name, s.description, s.duration_minutes, s.active
  from public.services s
  where s.active
  order by s.name;
$$;

revoke all on function public.list_active_services() from public;
grant execute on function public.list_active_services() to anon, authenticated;

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
    select duration_minutes
    from public.services
    where id = p_service_id and active
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
begin
  -- Serializes appointment creation with schedule blocking, closing the
  -- cross-table race that a same-table exclusion constraint cannot cover.
  perform pg_advisory_xact_lock(hashtext('clinica-ns-schedule'));

  if char_length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception using errcode = '22023', message = 'invalid_customer_name';
  end if;

  if char_length(regexp_replace(coalesce(p_customer_phone, ''), '\\D', '', 'g')) not between 10 and 13 then
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

create or replace function public.create_public_appointment(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text default null
)
returns table (
  appointment_id uuid,
  service_name text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select * from private.create_appointment_internal(
    p_service_id,
    p_starts_at,
    p_customer_name,
    p_customer_phone,
    p_customer_notes,
    'online'
  );
$$;

revoke all on function public.create_public_appointment(uuid, timestamptz, text, text, text) from public;
grant execute on function public.create_public_appointment(uuid, timestamptz, text, text, text) to anon, authenticated;

create or replace function public.create_admin_appointment(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text default null
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
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  perform pg_advisory_xact_lock(hashtext('clinica-ns-schedule'));

  return query
  select * from private.create_appointment_internal(
    p_service_id,
    p_starts_at,
    p_customer_name,
    p_customer_phone,
    p_customer_notes,
    'manual'
  );
end;
$$;

revoke all on function public.create_admin_appointment(uuid, timestamptz, text, text, text) from public;
grant execute on function public.create_admin_appointment(uuid, timestamptz, text, text, text) to authenticated;

create or replace function public.create_blocked_period(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_id uuid;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  if p_starts_at >= p_ends_at then
    raise exception using errcode = '22023', message = 'invalid_block_range';
  end if;

  if exists (
    select 1 from public.appointments appointment
    where appointment.status = 'confirmed'
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
        && tstzrange(p_starts_at, p_ends_at, '[)')
  ) then
    raise exception using errcode = '23P01', message = 'block_conflict';
  end if;

  insert into public.blocked_periods (starts_at, ends_at, reason)
  values (p_starts_at, p_ends_at, nullif(trim(coalesce(p_reason, '')), ''))
  returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.create_blocked_period(timestamptz, timestamptz, text) from public;
grant execute on function public.create_blocked_period(timestamptz, timestamptz, text) to authenticated;

insert into public.booking_settings (singleton, slot_interval_minutes)
values (true, 30)
on conflict (singleton) do nothing;

revoke all on schema private from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.business_hours to authenticated;
grant select, update on public.booking_settings to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert, delete on public.blocked_periods to authenticated;

comment on table public.appointments is 'Clínica NS appointments. Timestamps are UTC; business rules use America/Sao_Paulo.';
comment on constraint appointments_no_confirmed_overlap on public.appointments is 'Database-level guard against double booking for the single-clinic schedule.';
