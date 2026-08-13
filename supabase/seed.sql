-- mAITab Phase 2 seed
-- Prerequisites: run 01_schema.sql then 02_phase2.sql
-- Password for all demo users: MaiTabDemo!234
-- (bcrypt hash below generated for that password)

create extension if not exists "pgcrypto";
set search_path to public, extensions, auth;

-- Fixed IDs
-- Clubs
-- Neon District: 22222222-2222-2222-2222-222222222222 (~Mumbai)
-- Velvet Room (competitor ~0.8km): 22222222-2222-2222-2222-222222222223

-- Users (auth + public)
-- SUPER_ADMIN  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1
-- CLUB_ADMIN   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2
-- GATE_STAFF   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3
-- BARTENDER    aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4
-- AV_CONTROLLER aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5
-- CUSTOMER     11111111-1111-1111-1111-111111111111

do $$
declare
  v_pw text := crypt('MaiTabDemo!234', gen_salt('bf'));
begin
  -- Clubs first (geography: Neon District Bandra, competitor ~800m east)
  insert into public.clubs (
    id, name, location, lucky_draw_threshold_amount, active_promo_category,
    display_enabled, lucky_draw_enabled, prebook_buffer_minutes, subscription_tier, radius_config_m
  ) values
  (
    '22222222-2222-2222-2222-222222222222',
    'Neon District',
    st_setsrid(st_makepoint(72.8777, 19.0760), 4326)::geography,
    1500, null, true, true, 30, 'GROWTH', 1500
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'Velvet Room',
    st_setsrid(st_makepoint(72.8850, 19.0785), 4326)::geography,
    1500, 'BEER', true, true, 30, 'STARTER', 1500
  )
  on conflict (id) do update set
    name = excluded.name,
    location = excluded.location,
    lucky_draw_threshold_amount = excluded.lucky_draw_threshold_amount;

  -- Competitor already owns a BEER lockout window for anti-cannibalization demos
  delete from public.promo_lockouts
  where club_id = '22222222-2222-2222-2222-222222222223'
    and category = 'BEER';

  insert into public.promo_lockouts (club_id, category, locked_until)
  values (
    '22222222-2222-2222-2222-222222222223',
    'BEER',
    now() + interval '45 minutes'
  );

  -- Auth users
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'authenticated', 'authenticated', 'super@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','SUPER_ADMIN'),
    jsonb_build_object('full_name','Platform Owner'),
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'authenticated', 'authenticated', 'club@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','CLUB_ADMIN','club_id','22222222-2222-2222-2222-222222222222'),
    jsonb_build_object('full_name','Neon Club Admin'),
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'authenticated', 'authenticated', 'gate@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','GATE_STAFF','club_id','22222222-2222-2222-2222-222222222222'),
    jsonb_build_object('full_name','Gate Hostess'),
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'authenticated', 'authenticated', 'bar@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','BARTENDER','club_id','22222222-2222-2222-2222-222222222222'),
    jsonb_build_object('full_name','Lead Bartender'),
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    'authenticated', 'authenticated', 'av@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','AV_CONTROLLER','club_id','22222222-2222-2222-2222-222222222222'),
    jsonb_build_object('full_name','AV Controller'),
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'rahul@maitab.demo', v_pw, now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role','CUSTOMER'),
    jsonb_build_object('full_name','Rahul Deshmukh'),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    email_confirmed_at = now();

  -- Identities (required for email login in newer Supabase)
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  select
    u.id, u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', u.id::text, now(), now(), now()
  from auth.users u
  where u.id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    '11111111-1111-1111-1111-111111111111'
  )
  on conflict do nothing;

  insert into public.users (
    id, full_name, phone_number, role, global_spend_tier, favorite_drinks,
    autopay_mandate_id, autopay_status, lifetime_visits, club_id
  ) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Platform Owner', '+910000000001',
    'SUPER_ADMIN', 'TITAN', '[]'::jsonb, null, 'PENDING', 0, null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Neon Club Admin', '+910000000002',
    'CLUB_ADMIN', 'GOLD', '[]'::jsonb, null, 'PENDING', 0,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Gate Hostess', '+910000000003',
    'GATE_STAFF', 'SILVER', '[]'::jsonb, null, 'PENDING', 0,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Lead Bartender', '+910000000004',
    'BARTENDER', 'BRONZE', '[]'::jsonb, null, 'PENDING', 0,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'AV Controller', '+910000000005',
    'AV_CONTROLLER', 'BRONZE', '[]'::jsonb, null, 'PENDING', 0,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 'Rahul Deshmukh', '+919876543210',
    'CUSTOMER', 'GOLD',
    '[{"name":"Heineken","category":"BEER","times_ordered":18},{"name":"Espresso Martini","category":"COCKTAIL","times_ordered":9}]'::jsonb,
    'mandate_demo_rahul', 'ACTIVE', 27, null
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    global_spend_tier = excluded.global_spend_tier,
    favorite_drinks = excluded.favorite_drinks,
    autopay_mandate_id = excluded.autopay_mandate_id,
    autopay_status = excluded.autopay_status,
    club_id = excluded.club_id;
end $$;

-- Tables B1-B10 + V1-V3 for Neon District
insert into public.club_tables (id, club_id, table_code, status, parent_table_id, prebooked_at, prebook_slot_start)
select
  ('b0000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid,
  '22222222-2222-2222-2222-222222222222',
  'B' || gs,
  case when gs = 4 then 'MERGED_PARENT'::public.table_status
       when gs in (5, 6) then 'MERGED_CHILD'::public.table_status
       else 'AVAILABLE'::public.table_status end,
  case when gs in (5, 6) then 'b0000000-0000-0000-0000-000000000004'::uuid else null end,
  null, null
from generate_series(1, 10) as gs
on conflict (club_id, table_code) do update set
  status = excluded.status,
  parent_table_id = excluded.parent_table_id;

insert into public.club_tables (id, club_id, table_code, status, parent_table_id, prebooked_at, prebook_slot_start)
values
(
  'c0000000-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'V1', 'PRE_BOOKED', null, now(), now() + interval '25 minutes'
),
(
  'c0000000-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'V2', 'AVAILABLE', null, null, null
),
(
  'c0000000-0000-0000-0000-000000000003',
  '22222222-2222-2222-2222-222222222222',
  'V3', 'AVAILABLE', null, null, null
)
on conflict (club_id, table_code) do update set
  status = excluded.status,
  prebooked_at = excluded.prebooked_at,
  prebook_slot_start = excluded.prebook_slot_start;

-- Menu
insert into public.menu_items (club_id, name, category, unit_price, is_available, display_on)
select
  '22222222-2222-2222-2222-222222222222',
  m.name, m.category, m.unit_price, true, true
from (values
  ('Heineken', 'BEER', 350),
  ('Corona', 'BEER', 380),
  ('Espresso Martini', 'COCKTAIL', 650),
  ('Old Fashioned', 'COCKTAIL', 720),
  ('Tequila Shot', 'SHOT', 280),
  ('Jägerbomb', 'SHOT', 320)
) as m(name, category, unit_price)
where not exists (
  select 1 from public.menu_items mi
  where mi.club_id = '22222222-2222-2222-2222-222222222222'
    and mi.name = m.name
);

-- Active customer session on merged parent B4
insert into public.active_sessions (
  id, user_id, club_id, primary_table_id, total_session_spend,
  is_lucky_draw_eligible, is_vip, status, started_at
) values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'b0000000-0000-0000-0000-000000000004',
  2460, true, false, 'ACTIVE', now() - interval '72 minutes'
)
on conflict (id) do update set
  total_session_spend = excluded.total_session_spend,
  is_lucky_draw_eligible = excluded.is_lucky_draw_eligible,
  status = 'ACTIVE',
  ended_at = null;

update public.club_tables
set status = 'OCCUPIED'
where id = 'b0000000-0000-0000-0000-000000000004';

-- Seed orders (tokens)
insert into public.orders (
  id, session_id, club_id, items, total_amount, status, token_number, service_date, created_at, ready_at
) values
(
  'd0000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '[{"name":"Heineken","quantity":2,"unit_price":350,"category":"BEER"}]'::jsonb,
  700, 'PREPARING', 204, (now() at time zone 'Asia/Kolkata')::date,
  now() - interval '4 minutes', null
),
(
  'd0000000-0000-0000-0000-000000000002',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '[{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"},{"name":"Tequila Shot","quantity":4,"unit_price":280,"category":"SHOT"}]'::jsonb,
  1770, 'PENDING', 205, (now() at time zone 'Asia/Kolkata')::date,
  now() - interval '90 seconds', null
)
on conflict (id) do nothing;

-- Game catalog: run seed_games.sql after this file.
