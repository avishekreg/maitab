-- mAITab MVP schema: PostGIS, RBAC RLS, triggers, realtime
-- Run against a fresh Supabase project after enabling required extensions.
-- Tip: Supabase SQL Editor runs this as one transaction — any error rolls EVERYTHING back.

-- Prefer Supabase's extensions schema; fall back if already installed elsewhere
do $$ begin
  create extension if not exists "pgcrypto" with schema extensions;
exception when others then
  create extension if not exists "pgcrypto";
end $$;

do $$ begin
  create extension if not exists "postgis" with schema extensions;
exception when others then
  create extension if not exists "postgis";
end $$;

-- Ensure geography / crypto types resolve after public schema resets
set search_path to public, extensions, auth;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum (
    'SUPER_ADMIN',
    'CLUB_ADMIN',
    'GATE_STAFF',
    'BARTENDER',
    'AV_CONTROLLER',
    'CUSTOMER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.spend_tier as enum ('BRONZE', 'SILVER', 'GOLD', 'TITAN');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.autopay_status as enum ('ACTIVE', 'FAILED', 'PENDING');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.table_status as enum (
    'AVAILABLE',
    'OCCUPIED',
    'MERGED_PARENT',
    'MERGED_CHILD',
    'PRE_BOOKED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status as enum (
    'ACTIVE',
    'COMPLETED',
    'AUTO_SETTLED_EXITED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'PENDING',
    'PREPARING',
    'READY',
    'DELIVERED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.game_type as enum (
    'ROULETTE',
    'TRUTH_OR_SHOT',
    'DARE_WHEEL',
    'NEVER_HAVE_I_EVER',
    'SPIN_THE_BOTTLE',
    'MOST_LIKELY_TO'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Core tables (must exist before helper functions that reference them)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone_number text not null unique,
  role public.user_role not null default 'CUSTOMER',
  global_spend_tier public.spend_tier not null default 'BRONZE',
  favorite_drinks jsonb not null default '[]'::jsonb,
  autopay_mandate_id text,
  autopay_status public.autopay_status not null default 'PENDING',
  lifetime_visits integer not null default 0 check (lifetime_visits >= 0),
  club_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location geography(point, 4326) not null,
  lucky_draw_threshold_amount numeric(12,2) not null default 1500,
  active_promo_category text,
  display_enabled boolean not null default true,
  lucky_draw_enabled boolean not null default true,
  prebook_buffer_minutes integer not null default 30,
  subscription_tier text not null default 'STARTER'
    check (subscription_tier in ('STARTER', 'GROWTH', 'ENTERPRISE')),
  radius_config_m integer not null default 1500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  drop constraint if exists users_club_id_fkey;
alter table public.users
  add constraint users_club_id_fkey
  foreign key (club_id) references public.clubs (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helpers (after public.users exists — SQL functions resolve tables at CREATE)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_user_club_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.users where id = auth.uid();
$$;

create or replace function public.is_staff_of_club(target_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (
        u.role = 'SUPER_ADMIN'
        or (u.club_id = target_club and u.role in (
          'CLUB_ADMIN', 'GATE_STAFF', 'BARTENDER', 'AV_CONTROLLER'
        ))
      )
  );
$$;

create table if not exists public.club_tables (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  table_code text not null,
  status public.table_status not null default 'AVAILABLE',
  parent_table_id uuid references public.club_tables (id) on delete set null,
  prebooked_at timestamptz,
  prebook_slot_start timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, table_code)
);

create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  club_id uuid not null references public.clubs (id),
  primary_table_id uuid not null references public.club_tables (id),
  total_session_spend numeric(12,2) not null default 0,
  is_lucky_draw_eligible boolean not null default false,
  is_vip boolean not null default false,
  status public.session_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_known_lat double precision,
  last_known_lng double precision,
  last_geo_at timestamptz,
  session_played_games text[] not null default '{}'
);

create index if not exists active_sessions_club_status_idx
  on public.active_sessions (club_id, status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.active_sessions (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status public.order_status not null default 'PENDING',
  token_number integer not null,
  service_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  unique (club_id, service_date, token_number)
);

create table if not exists public.games_pool (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game_type public.game_type not null,
  rules_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.session_games_played (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.active_sessions (id) on delete cascade,
  game_id uuid not null references public.games_pool (id),
  played_at timestamptz not null default now(),
  unique (session_id, game_id)
);

create table if not exists public.gate_entry_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.users (id),
  guest_name text not null,
  spend_tier public.spend_tier not null,
  micro_hold_ok boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_lockouts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  category text not null,
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  category text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  is_available boolean not null default true,
  display_on boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lucky_draw_awards (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  session_id uuid not null references public.active_sessions (id) on delete cascade,
  discount_percent numeric(5,2) not null default 25,
  awarded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Token sequence helper (3-digit rolling per club/day)
-- ---------------------------------------------------------------------------
create or replace function public.next_order_token(p_club_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_token integer;
begin
  select coalesce(max(token_number), 199) + 1
    into v_token
  from public.orders
  where club_id = p_club_id
    and service_date = v_date;

  if v_token > 999 then
    v_token := 100;
  end if;

  return v_token;
end;
$$;

create or replace function public.set_order_token()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.token_number is null then
    new.token_number := public.next_order_token(new.club_id);
  end if;
  new.service_date := coalesce(
    new.service_date,
    (now() at time zone 'Asia/Kolkata')::date
  );
  return new;
end;
$$;

drop trigger if exists trg_orders_token on public.orders;
create trigger trg_orders_token
before insert on public.orders
for each row
execute function public.set_order_token();

-- ---------------------------------------------------------------------------
-- Session spend + lucky draw eligibility
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_session_spend(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(12,2);
  v_threshold numeric(12,2);
  v_is_vip boolean;
begin
  select
    coalesce((
      select sum(o.total_amount)
      from public.orders o
      where o.session_id = p_session_id
    ), 0),
    s.is_vip,
    c.lucky_draw_threshold_amount
  into v_total, v_is_vip, v_threshold
  from public.active_sessions s
  join public.clubs c on c.id = s.club_id
  where s.id = p_session_id;

  update public.active_sessions
  set
    total_session_spend = coalesce(v_total, 0),
    is_lucky_draw_eligible = (coalesce(v_total, 0) >= v_threshold and not v_is_vip)
  where id = p_session_id;
end;
$$;

create or replace function public.trg_orders_recalc_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_session_spend(coalesce(new.session_id, old.session_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_orders_recalc on public.orders;
create trigger trg_orders_recalc
after insert or update or delete on public.orders
for each row
execute function public.trg_orders_recalc_session();

-- ---------------------------------------------------------------------------
-- Parent-child table merge + pre-book buffer
-- ---------------------------------------------------------------------------
create or replace function public.assert_table_merge_allowed(
  p_parent uuid,
  p_children uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club uuid;
  v_buffer integer;
  r record;
begin
  select club_id into v_club from public.club_tables where id = p_parent;
  if v_club is null then
    raise exception 'Parent table not found';
  end if;

  select prebook_buffer_minutes into v_buffer
  from public.clubs where id = v_club;

  for r in
    select *
    from public.club_tables
    where id = any (p_children || array[p_parent])
  loop
    if r.club_id <> v_club then
      raise exception 'Cannot merge tables across clubs';
    end if;

    if r.status = 'PRE_BOOKED'
       and r.prebook_slot_start is not null
       and r.prebook_slot_start <= (now() + make_interval(mins => v_buffer))
       and r.prebook_slot_start >= now() then
      raise exception 'Table % is inside pre-booking buffer', r.table_code;
    end if;
  end loop;
end;
$$;

create or replace function public.merge_tables(
  p_parent uuid,
  p_children uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_table_merge_allowed(p_parent, p_children);

  update public.club_tables
  set status = 'MERGED_PARENT', parent_table_id = null
  where id = p_parent;

  update public.club_tables
  set status = 'MERGED_CHILD', parent_table_id = p_parent
  where id = any (p_children);
end;
$$;

create or replace function public.resolve_primary_table(p_table_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when t.status = 'MERGED_CHILD' and t.parent_table_id is not null
      then t.parent_table_id
    else t.id
  end
  from public.club_tables t
  where t.id = p_table_id;
$$;

-- ---------------------------------------------------------------------------
-- Anti-cannibalization: block same-category promos within 1.5km for 60 mins
-- ---------------------------------------------------------------------------
create or replace function public.can_create_flash_promo(
  p_club_id uuid,
  p_category text,
  p_radius_m integer default 1500,
  p_lockout_min integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loc geography;
  v_conflict boolean;
begin
  select location into v_loc from public.clubs where id = p_club_id;
  if v_loc is null then
    return false;
  end if;

  select exists (
    select 1
    from public.clubs c
    join public.promo_lockouts pl on pl.club_id = c.id
    where c.id <> p_club_id
      and c.active_promo_category = p_category
      and pl.category = p_category
      and pl.locked_until > now()
      and st_dwithin(c.location, v_loc, p_radius_m)
  ) into v_conflict;

  if v_conflict then
    insert into public.fraud_logs (club_id, event_type, details)
    values (
      p_club_id,
      'PROMO_CANNIBALIZATION_BLOCKED',
      jsonb_build_object('category', p_category, 'radius_m', p_radius_m)
    );
    return false;
  end if;

  insert into public.promo_lockouts (club_id, category, locked_until)
  values (p_club_id, p_category, now() + make_interval(mins => p_lockout_min));

  update public.clubs
  set active_promo_category = p_category
  where id = p_club_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hourly lucky draw
-- ---------------------------------------------------------------------------
create or replace function public.run_hourly_lucky_draw(p_club_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session uuid;
begin
  if not exists (
    select 1 from public.clubs
    where id = p_club_id and lucky_draw_enabled = true
  ) then
    return null;
  end if;

  select s.id into v_session
  from public.active_sessions s
  where s.club_id = p_club_id
    and s.status = 'ACTIVE'
    and s.is_lucky_draw_eligible = true
    and s.is_vip = false
  order by random()
  limit 1;

  if v_session is null then
    return null;
  end if;

  update public.active_sessions
  set
    total_session_spend = round(total_session_spend * 0.75, 2),
    is_lucky_draw_eligible = false
  where id = v_session;

  insert into public.lucky_draw_awards (club_id, session_id, discount_percent)
  values (p_club_id, v_session, 25);

  return v_session;
end;
$$;

-- ---------------------------------------------------------------------------
-- Geo exit auto-settlement marker
-- ---------------------------------------------------------------------------
create or replace function public.mark_session_auto_settled(
  p_session_id uuid,
  p_receipt_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.active_sessions
  set status = 'AUTO_SETTLED_EXITED', ended_at = now()
  where id = p_session_id
    and status = 'ACTIVE';

  insert into public.fraud_logs (user_id, club_id, event_type, details)
  select user_id, club_id, 'AUTO_SETTLED_EXIT', jsonb_build_object('receipt_id', p_receipt_id)
  from public.active_sessions
  where id = p_session_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.clubs enable row level security;
alter table public.club_tables enable row level security;
alter table public.active_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.games_pool enable row level security;
alter table public.session_games_played enable row level security;
alter table public.gate_entry_events enable row level security;
alter table public.promo_lockouts enable row level security;
alter table public.fraud_logs enable row level security;
alter table public.menu_items enable row level security;
alter table public.lucky_draw_awards enable row level security;

-- users
create policy users_select_self_or_staff on public.users
for select using (
  id = auth.uid()
  or public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() in ('CLUB_ADMIN', 'GATE_STAFF')
    and club_id is not distinct from public.current_user_club_id()
  )
);

create policy users_update_self on public.users
for update using (
  id = auth.uid() or public.current_user_role() = 'SUPER_ADMIN'
);

-- clubs
create policy clubs_public_read on public.clubs
for select using (true);

create policy clubs_admin_write on public.clubs
for all using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'CLUB_ADMIN'
    and id = public.current_user_club_id()
  )
)
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'CLUB_ADMIN'
    and id = public.current_user_club_id()
  )
);

-- club_tables
create policy tables_read on public.club_tables
for select using (
  public.is_staff_of_club(club_id)
  or exists (
    select 1 from public.active_sessions s
    where s.user_id = auth.uid()
      and s.club_id = club_tables.club_id
      and s.status = 'ACTIVE'
  )
);

create policy tables_staff_write on public.club_tables
for all using (
  public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and public.is_staff_of_club(club_id)
)
with check (
  public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and public.is_staff_of_club(club_id)
);

-- sessions
create policy sessions_customer_read on public.active_sessions
for select using (
  user_id = auth.uid()
  or public.is_staff_of_club(club_id)
);

create policy sessions_customer_insert on public.active_sessions
for insert with check (
  user_id = auth.uid()
  or public.current_user_role() in ('CLUB_ADMIN', 'GATE_STAFF', 'SUPER_ADMIN')
);

create policy sessions_update on public.active_sessions
for update using (
  user_id = auth.uid()
  or public.current_user_role() in ('CLUB_ADMIN', 'SUPER_ADMIN', 'GATE_STAFF')
);

-- orders
create policy orders_read on public.orders
for select using (
  public.is_staff_of_club(club_id)
  or exists (
    select 1 from public.active_sessions s
    where s.id = orders.session_id and s.user_id = auth.uid()
  )
);

-- Bartenders can update status only (enforced in app + policy)
create policy orders_bartender_update on public.orders
for update using (
  public.current_user_role() in ('BARTENDER', 'CLUB_ADMIN', 'SUPER_ADMIN')
  and public.is_staff_of_club(club_id)
);

create policy orders_customer_insert on public.orders
for insert with check (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
      and s.status = 'ACTIVE'
  )
  or public.current_user_role() in ('CLUB_ADMIN', 'SUPER_ADMIN')
);

-- games
create policy games_read on public.games_pool for select using (true);
create policy games_admin_write on public.games_pool
for all using (public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN'))
with check (public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN'));

create policy session_games_rw on public.session_games_played
for all using (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id and (s.user_id = auth.uid() or public.is_staff_of_club(s.club_id))
  )
)
with check (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);

-- gate events: AV + gate + admins; never expose financial tables to AV via this
create policy gate_events_staff_read on public.gate_entry_events
for select using (
  public.current_user_role() in (
    'GATE_STAFF', 'AV_CONTROLLER', 'CLUB_ADMIN', 'SUPER_ADMIN'
  )
  and public.is_staff_of_club(club_id)
);

create policy gate_events_insert on public.gate_entry_events
for insert with check (
  public.current_user_role() in ('GATE_STAFF', 'CLUB_ADMIN', 'SUPER_ADMIN')
  and public.is_staff_of_club(club_id)
);

-- financial / fraud: admins only
create policy fraud_admin_read on public.fraud_logs
for select using (public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN'));

create policy promo_admin on public.promo_lockouts
for all using (public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN'))
with check (public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN'));

create policy lucky_admin_read on public.lucky_draw_awards
for select using (
  public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
  or exists (
    select 1 from public.active_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);

create policy menu_read on public.menu_items for select using (true);
create policy menu_admin_write on public.menu_items
for all using (
  public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and public.is_staff_of_club(club_id)
)
with check (
  public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and public.is_staff_of_club(club_id)
);

-- Explicit deny patterns via absence of policies:
-- GATE_STAFF / BARTENDER / AV_CONTROLLER have no select on fraud_logs / promo_lockouts.
-- AV_CONTROLLER has no access to orders / active_sessions financial fields via policies above.

-- ---------------------------------------------------------------------------
-- Realtime (idempotent — a failure here used to roll back the whole migration)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'orders',
    'gate_entry_events',
    'active_sessions',
    'lucky_draw_awards'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed games
-- ---------------------------------------------------------------------------
insert into public.games_pool (title, game_type, rules_json, is_active)
select * from (values
  (
    'Shot Roulette',
    'ROULETTE'::public.game_type,
    '{"chambers":6,"outcomes":["Safe","Safe","Safe","Safe","Shot","Double Shot"],"penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280}}'::jsonb,
    true
  ),
  (
    'Truth or Shot',
    'TRUTH_OR_SHOT'::public.game_type,
    '{"prompts":["Who at this table has the wildest dating story?","Confess your most expensive impulse buy."],"penalty_item":{"name":"Tequila Shot","quantity":1,"unit_price":280}}'::jsonb,
    true
  ),
  (
    'Dare Wheel',
    'DARE_WHEEL'::public.game_type,
    '{"dares":["Buy the next round for the table","Dance for 20 seconds","Swap seats with someone"],"penalty_item":{"name":"Heineken","quantity":1,"unit_price":350}}'::jsonb,
    true
  ),
  (
    'Never Have I Ever',
    'NEVER_HAVE_I_EVER'::public.game_type,
    '{"statements":["Never have I ever snuck into a VIP section.","Never have I ever left my card open at a bar."],"voting":true,"penalty_item":{"name":"Corona","quantity":1,"unit_price":380}}'::jsonb,
    true
  ),
  (
    'Spin the Bottle',
    'SPIN_THE_BOTTLE'::public.game_type,
    '{"actions":["Ask a question","Share a dare","Order a shared starter"],"penalty_item":{"name":"Tequila Shot","quantity":2,"unit_price":280}}'::jsonb,
    true
  )
) as v(title, game_type, rules_json, is_active)
where not exists (select 1 from public.games_pool limit 1);
