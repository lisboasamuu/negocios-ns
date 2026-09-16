-- DEMONSTRATION seed for local/development environments only.
-- No fictional customers or appointments are created.

insert into public.services (id, name, description, duration_minutes, active)
values
  ('10000000-0000-4000-8000-000000000001', 'Harmonização facial', 'Realce seus traços preservando sua identidade e naturalidade.', 60, true),
  ('10000000-0000-4000-8000-000000000002', 'Bioestimuladores', 'Protocolos voltados ao estímulo de colágeno e cuidado com a pele.', 60, true),
  ('10000000-0000-4000-8000-000000000003', 'Limpeza de pele', 'Cuidado profundo para uma pele mais saudável e revitalizada.', 60, true),
  ('10000000-0000-4000-8000-000000000004', 'Tratamentos corporais', 'Protocolos personalizados de acordo com seus objetivos.', 90, true),
  ('10000000-0000-4000-8000-000000000005', 'Rejuvenescimento', 'Tecnologias e cuidados para uma aparência descansada e natural.', 60, true),
  ('10000000-0000-4000-8000-000000000006', 'Skincare personalizado', 'Uma rotina de cuidados pensada para as necessidades da sua pele.', 45, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  active = excluded.active;

insert into public.business_hours (weekday, start_time, end_time, active)
values
  (1, '09:00', '18:00', true),
  (2, '09:00', '18:00', true),
  (3, '09:00', '18:00', true),
  (4, '09:00', '18:00', true),
  (5, '09:00', '18:00', true),
  (6, '09:00', '13:00', true)
on conflict (weekday, start_time, end_time) do nothing;

-- After creating the administrator in Supabase Auth, authorize that exact user:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@example.com';
