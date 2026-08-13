-- mAITab Phase 2 seed
-- Prerequisites: run 01_schema.sql then 02_phase2.sql
-- Password for all demo users: MaiTabDemo!234
-- (bcrypt hash below generated for that password)

create extension if not exists "pgcrypto";

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
  'v0000000-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'V1', 'PRE_BOOKED', null, now(), now() + interval '25 minutes'
),
(
  'v0000000-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'V2', 'AVAILABLE', null, null, null
),
(
  'v0000000-0000-0000-0000-000000000003',
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
  'o0000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '[{"name":"Heineken","quantity":2,"unit_price":350,"category":"BEER"}]'::jsonb,
  700, 'PREPARING', 204, (now() at time zone 'Asia/Kolkata')::date,
  now() - interval '4 minutes', null
),
(
  'o0000000-0000-0000-0000-000000000002',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '[{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"},{"name":"Tequila Shot","quantity":4,"unit_price":280,"category":"SHOT"}]'::jsonb,
  1770, 'PENDING', 205, (now() at time zone 'Asia/Kolkata')::date,
  now() - interval '90 seconds', null
)
on conflict (id) do nothing;

-- Phase 5: 105 nightlife games for games_pool (run after 04_games_engine.sql)

insert into public.games_pool (title, game_type, rules_json, is_active)
select v.title, v.game_type, v.rules_json, v.is_active
from (values
  ('Classic Shot Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Safe","Safe","Safe","Shot","Double Shot"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-01","weight":1.4,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Left Neighbour Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Left Neighbour Takes a Shot","Safe","Safe","Shot","Host Chooses"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-02","weight":1.4,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Youngest Drinks Wheel', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Youngest at the Table Drinks","Safe","Shot","Safe","Double for Youngest"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-03","weight":1.4,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Host Chooses Victim', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Host Chooses the Victim","Safe","Safe","Shot","Table Vote Victim"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-04","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Double Shot Challenge', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Safe","Double Shot Challenge","Safe","Shot","Safe"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-05","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Opposite Seat Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Opposite Seat Drinks","Safe","Shot","Safe","Both Ends Drink"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-06","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Birthday Bomb Wheel', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Birthday (or Closest) Drinks","Safe","Shot","Safe","Table Cheers"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-07","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Spend King Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Highest Spender Sips","Safe","Shot","Safe","Tab Owner Chooses"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-08","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Quiet One Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Quietest Person Drinks","Safe","Shot","Safe","Make Them Speak"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-09","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Phone Stack Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","First to Touch Phone Drinks","Safe","Shot","Safe","All Phones Down"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-10","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Neon Chamber', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Safe","Neon Shot","Safe","Ruby Shot","Double Neon"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-11","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('VIP Pressure Wheel', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","VIP Impression or Shot","Safe","Shot","Safe","Buy-In Round"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-12","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Mirror Challenge Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Mirror Selfie or Shot","Safe","Shot","Safe","Group Pose"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-13","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Last Call Roulette', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Last Call Sip","Safe","Shot","Safe","Closing Time Double"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-14","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Chaos Chamber', 'ROULETTE'::public.game_type, '{"chambers":6,"outcomes":["Safe","Everyone Sips","Safe","Shot","Host Safe Others Drink","Double Chaos"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-roulette-15","weight":1,"min_group_size":2,"min_spend":0,"category":"SHOT_ROULETTE","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #1', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Show your last searched photo or take a shot","Reveal the last person you double-texted","Who here would you trust with your phone for 60 seconds?"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-01","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #2', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Read your last unread DM out loud","Confess who at this table you''d secretly take on a date","Admit the last club you got kicked out of — or shot"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-02","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #3', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Point to the person who spent the most tonight","Show your lock-screen without unlocking — or drink","Rate everyone''s outfit from 1–10, then drink if you''re last"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-03","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #4', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Reveal the last person you double-texted","Name the most expensive mistake on a tab you''ve made","Share your most chaotic Uber story from a night out"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-04","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #5', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Confess who at this table you''d secretly take on a date","Who here would you trust with your phone for 60 seconds?","Who at the table has the most dangerous smile?"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-05","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #6', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Show your lock-screen without unlocking — or drink","Admit the last club you got kicked out of — or shot","Open your gallery on a random scroll — or take a shot"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-06","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Truth or Shot #7', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Name the most expensive mistake on a tab you''ve made","Rate everyone''s outfit from 1–10, then drink if you''re last","What''s your toxic nightlife trait?"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-07","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Truth or Shot #8', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Who here would you trust with your phone for 60 seconds?","Share your most chaotic Uber story from a night out","Name someone you''ve ghosted after matching at a bar"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-08","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #9', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Admit the last club you got kicked out of — or shot","Who at the table has the most dangerous smile?","Who would survive a night without their phone?"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-09","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #10', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Rate everyone''s outfit from 1–10, then drink if you''re last","Open your gallery on a random scroll — or take a shot","Confess your go-to flirting opener — no filter"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-10","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #11', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Share your most chaotic Uber story from a night out","What''s your toxic nightlife trait?","Point to who is most likely to start a group chat drama"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-11","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #12', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Who at the table has the most dangerous smile?","Name someone you''ve ghosted after matching at a bar","What''s the wildest thing on your current tab?"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-12","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #13', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Open your gallery on a random scroll — or take a shot","Who would survive a night without their phone?","Have you ever pretended to know the DJ?"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-13","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #14', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["What''s your toxic nightlife trait?","Confess your go-to flirting opener — no filter","Who here spends like a Titan but claims Bronze?"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-14","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #15', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Name someone you''ve ghosted after matching at a bar","Point to who is most likely to start a group chat drama","Reveal your last sent voice note topic — or drink"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-15","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Truth or Shot #16', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Who would survive a night without their phone?","What''s the wildest thing on your current tab?","Which ex would you buy one drink for tonight?"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-16","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Truth or Shot #17', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Confess your go-to flirting opener — no filter","Have you ever pretended to know the DJ?","Who is most likely to lose their card before midnight?"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-17","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #18', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Point to who is most likely to start a group chat drama","Who here spends like a Titan but claims Bronze?","Admit the last time you said ''one more'' and meant five"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-18","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #19', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["What''s the wildest thing on your current tab?","Reveal your last sent voice note topic — or drink","Show your last searched photo or take a shot"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-19","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #20', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Have you ever pretended to know the DJ?","Which ex would you buy one drink for tonight?","Read your last unread DM out loud"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-20","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #21', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Who here spends like a Titan but claims Bronze?","Who is most likely to lose their card before midnight?","Point to the person who spent the most tonight"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-21","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Truth or Shot #22', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Reveal your last sent voice note topic — or drink","Admit the last time you said ''one more'' and meant five","Reveal the last person you double-texted"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-22","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #23', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Which ex would you buy one drink for tonight?","Show your last searched photo or take a shot","Confess who at this table you''d secretly take on a date"],"upsell_label":"Pay Penalty / Order Round","vibe":"friends","catalog_id":"g-truth-23","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Truth or Shot #24', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Who is most likely to lose their card before midnight?","Read your last unread DM out loud","Show your lock-screen without unlocking — or drink"],"upsell_label":"Pay Penalty / Order Round","vibe":"groups","catalog_id":"g-truth-24","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Truth or Shot #25', 'TRUTH_OR_SHOT'::public.game_type, '{"prompts":["Admit the last time you said ''one more'' and meant five","Point to the person who spent the most tonight","Name the most expensive mistake on a tab you''ve made"],"upsell_label":"Pay Penalty / Order Round","vibe":"couples","catalog_id":"g-truth-25","weight":1.1,"min_group_size":2,"min_spend":0,"category":"TRUTH_OR_SHOT","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Get the bartender to give yo…', 'DARE_WHEEL'::public.game_type, '{"dares":["Get the bartender to give you a high five","Ask the neighboring table for a lighter — dramatically","Trade one accessory with someone at the table","Walk to the bar and back without looking at your phone"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-01","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Do a 10-second runway walk t…', 'DARE_WHEEL'::public.game_type, '{"dares":["Do a 10-second runway walk to the bar","Start a 15-second clap chant for the DJ","Send a voice note saying ''We''re legends tonight''","Invent a VIP handshake with the person on your left"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-02","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Swap seats with the person a…', 'DARE_WHEEL'::public.game_type, '{"dares":["Swap seats with the person across from you for 2 rounds","Take a mirror selfie with the whole table","Balance a coaster on your head for 20 seconds","Sing the chorus of the current track — standing"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-03","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Order a drink using only son…', 'DARE_WHEEL'::public.game_type, '{"dares":["Order a drink using only song lyrics","Compliment three strangers before returning","Mime your favorite cocktail for the table to guess","Ask staff for ice like you''re in a spy movie"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-04","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Ask the neighboring table fo…', 'DARE_WHEEL'::public.game_type, '{"dares":["Ask the neighboring table for a lighter — dramatically","Do your best VIP hostess welcome for 10 seconds","Get someone to say ''mAITab'' on camera","Propose a toast using only three words"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-05","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Start a 15-second clap chant…', 'DARE_WHEEL'::public.game_type, '{"dares":["Start a 15-second clap chant for the DJ","Trade one accessory with someone at the table","Walk to the bar and back without looking at your phone","Wear your jacket inside-out for one full song"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-06","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Take a mirror selfie with th…', 'DARE_WHEEL'::public.game_type, '{"dares":["Take a mirror selfie with the whole table","Send a voice note saying ''We''re legends tonight''","Invent a VIP handshake with the person on your left","Do a silent disco dance until the beat drops"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-07","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Compliment three strangers b…', 'DARE_WHEEL'::public.game_type, '{"dares":["Compliment three strangers before returning","Balance a coaster on your head for 20 seconds","Sing the chorus of the current track — standing","Collect five high-fives from the dancefloor"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-08","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Do your best VIP hostess wel…', 'DARE_WHEEL'::public.game_type, '{"dares":["Do your best VIP hostess welcome for 10 seconds","Mime your favorite cocktail for the table to guess","Ask staff for ice like you''re in a spy movie","Order water with the confidence of champagne"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-09","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Trade one accessory with som…', 'DARE_WHEEL'::public.game_type, '{"dares":["Trade one accessory with someone at the table","Get someone to say ''mAITab'' on camera","Propose a toast using only three words","Recreate a red-carpet pose at the table edge"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-10","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Send a voice note saying ''We…', 'DARE_WHEEL'::public.game_type, '{"dares":["Send a voice note saying ''We''re legends tonight''","Walk to the bar and back without looking at your phone","Wear your jacket inside-out for one full song","Switch drinks with someone for the next sip (consensual)"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-11","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Balance a coaster on your he…', 'DARE_WHEEL'::public.game_type, '{"dares":["Balance a coaster on your head for 20 seconds","Invent a VIP handshake with the person on your left","Do a silent disco dance until the beat drops","Get the bartender to give you a high five"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-12","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Mime your favorite cocktail …', 'DARE_WHEEL'::public.game_type, '{"dares":["Mime your favorite cocktail for the table to guess","Sing the chorus of the current track — standing","Collect five high-fives from the dancefloor","Do a 10-second runway walk to the bar"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-13","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Get someone to say ''mAITab'' …', 'DARE_WHEEL'::public.game_type, '{"dares":["Get someone to say ''mAITab'' on camera","Ask staff for ice like you''re in a spy movie","Order water with the confidence of champagne","Swap seats with the person across from you for 2 rounds"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-14","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Walk to the bar and back wit…', 'DARE_WHEEL'::public.game_type, '{"dares":["Walk to the bar and back without looking at your phone","Propose a toast using only three words","Recreate a red-carpet pose at the table edge","Order a drink using only song lyrics"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-15","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Invent a VIP handshake with …', 'DARE_WHEEL'::public.game_type, '{"dares":["Invent a VIP handshake with the person on your left","Wear your jacket inside-out for one full song","Switch drinks with someone for the next sip (consensual)","Ask the neighboring table for a lighter — dramatically"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-16","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Sing the chorus of the curre…', 'DARE_WHEEL'::public.game_type, '{"dares":["Sing the chorus of the current track — standing","Do a silent disco dance until the beat drops","Get the bartender to give you a high five","Start a 15-second clap chant for the DJ"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-17","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Ask staff for ice like you''r…', 'DARE_WHEEL'::public.game_type, '{"dares":["Ask staff for ice like you''re in a spy movie","Collect five high-fives from the dancefloor","Do a 10-second runway walk to the bar","Take a mirror selfie with the whole table"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-18","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Propose a toast using only t…', 'DARE_WHEEL'::public.game_type, '{"dares":["Propose a toast using only three words","Order water with the confidence of champagne","Swap seats with the person across from you for 2 rounds","Compliment three strangers before returning"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-19","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Wear your jacket inside-out …', 'DARE_WHEEL'::public.game_type, '{"dares":["Wear your jacket inside-out for one full song","Recreate a red-carpet pose at the table edge","Order a drink using only song lyrics","Do your best VIP hostess welcome for 10 seconds"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-20","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Dare Wheel: Do a silent disco dance unti…', 'DARE_WHEEL'::public.game_type, '{"dares":["Do a silent disco dance until the beat drops","Switch drinks with someone for the next sip (consensual)","Ask the neighboring table for a lighter — dramatically","Trade one accessory with someone at the table"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-21","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Collect five high-fives from…', 'DARE_WHEEL'::public.game_type, '{"dares":["Collect five high-fives from the dancefloor","Get the bartender to give you a high five","Start a 15-second clap chant for the DJ","Send a voice note saying ''We''re legends tonight''"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-22","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Dare Wheel: Order water with the confide…', 'DARE_WHEEL'::public.game_type, '{"dares":["Order water with the confidence of champagne","Do a 10-second runway walk to the bar","Take a mirror selfie with the whole table","Balance a coaster on your head for 20 seconds"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-23","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Recreate a red-carpet pose a…', 'DARE_WHEEL'::public.game_type, '{"dares":["Recreate a red-carpet pose at the table edge","Swap seats with the person across from you for 2 rounds","Compliment three strangers before returning","Mime your favorite cocktail for the table to guess"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-24","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Dare Wheel: Switch drinks with someone f…', 'DARE_WHEEL'::public.game_type, '{"dares":["Switch drinks with someone for the next sip (consensual)","Order a drink using only song lyrics","Do your best VIP hostess welcome for 10 seconds","Get someone to say ''mAITab'' on camera"],"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-dare-25","weight":1.15,"min_group_size":2,"min_spend":500,"category":"DARE_WHEEL","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #1', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever ghosted someone at a club","Never have I ever name-dropped to skip a queue","Never have I ever said ''I''m leaving'' three times"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-01","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #2', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever ordered the most expensive drink on someone else''s tab","Never have I ever danced on a platform","Never have I ever Instagram-storied a stranger''s fit"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-02","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #3', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever snuck into a VIP section","Never have I ever lost a jacket at coat check","Never have I ever asked the DJ for a song"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-03","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #4', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever pretended to know a song''s lyrics","Never have I ever taken a shot I regretted mid-swallow","Never have I ever spilled a drink on the dancefloor"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-04","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('NHIE Party #5', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever left my card open at a bar","Never have I ever flirted for a free drink","Never have I ever claimed a table I didn''t book"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-05","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('NHIE Party #6', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever name-dropped to skip a queue","Never have I ever used someone else''s Autopay story","Never have I ever switched seats to avoid someone"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-06","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #7', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever danced on a platform","Never have I ever said ''I''m leaving'' three times","Never have I ever paid for a round I didn''t drink"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-07","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #8', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever lost a jacket at coat check","Never have I ever Instagram-storied a stranger''s fit","Never have I ever used a fake name at entry"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-08","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #9', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever taken a shot I regretted mid-swallow","Never have I ever asked the DJ for a song","Never have I ever celebrated a lucky-draw win"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-09","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #10', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever flirted for a free drink","Never have I ever spilled a drink on the dancefloor","Never have I ever ghosted someone at a club"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-10","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #11', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever used someone else''s Autopay story","Never have I ever claimed a table I didn''t book","Never have I ever ordered the most expensive drink on someone else''s tab"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-11","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #12', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever said ''I''m leaving'' three times","Never have I ever switched seats to avoid someone","Never have I ever snuck into a VIP section"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-12","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #13', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever Instagram-storied a stranger''s fit","Never have I ever paid for a round I didn''t drink","Never have I ever pretended to know a song''s lyrics"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-13","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('NHIE Party #14', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever asked the DJ for a song","Never have I ever used a fake name at entry","Never have I ever left my card open at a bar"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-14","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('NHIE Party #15', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever spilled a drink on the dancefloor","Never have I ever celebrated a lucky-draw win","Never have I ever name-dropped to skip a queue"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-15","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('NHIE Party #16', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever claimed a table I didn''t book","Never have I ever ghosted someone at a club","Never have I ever danced on a platform"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-16","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #17', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever switched seats to avoid someone","Never have I ever ordered the most expensive drink on someone else''s tab","Never have I ever lost a jacket at coat check"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-17","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #18', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever paid for a round I didn''t drink","Never have I ever snuck into a VIP section","Never have I ever taken a shot I regretted mid-swallow"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-18","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #19', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever used a fake name at entry","Never have I ever pretended to know a song''s lyrics","Never have I ever flirted for a free drink"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-19","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('NHIE Party #20', 'NEVER_HAVE_I_EVER'::public.game_type, '{"statements":["Never have I ever celebrated a lucky-draw win","Never have I ever left my card open at a bar","Never have I ever used someone else''s Autopay story"],"voting":true,"realtime":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-nhie-20","weight":1.2,"min_group_size":3,"min_spend":0,"category":"NHIE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #1', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Secret Pass: whisper a dare","Table roast (kind)","Share a first-date fail","Order a shared starter"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-01","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #2', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Haptic spin: left seat challenge","Right seat truth","Host picks challenge","Group toast"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-02","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #3', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Bottle points: compliment chain","Eye contact 10s","Swap one fun fact","Shot or story"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-03","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #4', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Secret crush prompt","Playlist confession","Dance-off opener","Pass the phone selfie"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-04","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #5', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Midnight pact challenge","Two truths one lie","Seat roulette","Buy-in toast"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-05","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #6', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Silent stare-off","Rizz rating","VIP impression","Bar quiz"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-06","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #7', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Coin flip honesty","Nickname generator","Emoji only chat","Round robin dare"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-07","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #8', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Spotlight spin","Wingman duty","Table anthem","Mystery toast"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-08","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #9', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Left-hand sip challenge","Phone stack game","Accent dare","Glow-up tip"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-09","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Spin the Bottle & Secret Pass #10', 'SPIN_THE_BOTTLE'::public.game_type, '{"actions":["Secret handshake invent","Fortune teller spin","Group whisper","Last-call prophecy"],"haptic":true,"upsell_label":"Pay Penalty / Order Round","catalog_id":"g-bottle-10","weight":1,"min_group_size":3,"min_spend":0,"category":"SPIN_BOTTLE","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Most Likely To… #1', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to start a tab they can''t close"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-01","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true),
  ('Most Likely To… #2', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to end up in the DJ booth"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-02","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Gin & Tonic","quantity":1,"unit_price":520,"category":"COCKTAIL"}}'::jsonb, true),
  ('Most Likely To… #3', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to lose their phone tonight"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-03","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Espresso Martini","quantity":1,"unit_price":650,"category":"COCKTAIL"}}'::jsonb, true),
  ('Most Likely To… #4', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to order bottle service ''for the aesthetic''"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-04","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Table Round (Heineken)","quantity":4,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Most Likely To… #5', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to get a Titan welcome on the AV wall"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-05","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Most Likely To… #6', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to ghost the group chat tomorrow"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-06","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280,"category":"SHOT"}}'::jsonb, true),
  ('Most Likely To… #7', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to claim ''I''m a chill drinker''"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-07","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Vodka Shot","quantity":1,"unit_price":260,"category":"SHOT"}}'::jsonb, true),
  ('Most Likely To… #8', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to know the gate staff by name"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-08","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Jägerbomb","quantity":1,"unit_price":450,"category":"SHOT"}}'::jsonb, true),
  ('Most Likely To… #9', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to turn a dare into a viral clip"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-09","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Heineken","quantity":1,"unit_price":350,"category":"BEER"}}'::jsonb, true),
  ('Most Likely To… #10', 'MOST_LIKELY_TO'::public.game_type, '{"prompts":["Most likely to merge three tables by accident"],"voting":true,"loser_penalty":true,"upsell_label":"Loser Pays — Add Shot to Tab","catalog_id":"g-mlt-10","weight":1.25,"min_group_size":3,"min_spend":800,"category":"MOST_LIKELY_TO","penalty_item":{"name":"Corona","quantity":1,"unit_price":380,"category":"BEER"}}'::jsonb, true)
) as v(title, game_type, rules_json, is_active)
where not exists (
  select 1 from public.games_pool g where g.title = v.title
);

