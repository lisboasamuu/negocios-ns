begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select has_table('public', 'appointments', 'appointments table exists');
select has_table('public', 'blocked_periods', 'blocked periods table exists');
select has_table('public', 'admin_users', 'admin allowlist exists');
select has_function('public', 'get_available_slots', array['uuid', 'date'], 'public availability RPC exists');
select has_function('public', 'create_public_appointment', array['uuid', 'timestamp with time zone', 'text', 'text', 'text'], 'public booking RPC exists');
select has_function('public', 'create_admin_appointment', array['uuid', 'timestamp with time zone', 'text', 'text', 'text'], 'admin booking RPC exists');

select ok((select relrowsecurity from pg_class where oid = 'public.appointments'::regclass), 'appointments has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.services'::regclass), 'services has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.blocked_periods'::regclass), 'blocked periods has RLS');
select ok(not has_table_privilege('anon', 'public.appointments', 'select'), 'anonymous users cannot read customer appointments');
select ok(has_function_privilege('anon', 'public.get_available_slots(uuid,date)', 'execute'), 'anonymous users can request safe availability');
select ok(not has_function_privilege('anon', 'public.create_admin_appointment(uuid,timestamptz,text,text,text)', 'execute'), 'anonymous users cannot create administrative appointments');

select * from finish();
rollback;
