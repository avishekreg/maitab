-- Enterprise Floor Engine:
-- FLOOR_MANAGER / CAPTAIN roles, bar counters, flash campaigns, promo credits

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
alter type public.user_role add value if not exists 'FLOOR_MANAGER';
alter type public.user_role add value if not exists 'CAPTAIN';

create or replace function public.is_staff_of_club(target_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (
        u.role = 'SUPER_ADMIN'
        or (
          u.club_id = target_club
          and u.role::text in (
            'CLUB_ADMIN', 'GATE_STAFF', 'BARTENDER', 'AV_CONTROLLER',
            'FLOOR_MANAGER', 'CAPTAIN'
          )
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Multi-venue property groups + promo credit balance on clubs
-- ---------------------------------------------------------------------------
alter table public.clubs
  add column if not exists owner_group_id uuid,
  add column if not exists credit_balance numeric(12, 2) not null default 0,
  add column if not exists short_name text;

create index if not exists idx_clubs_owner_group
  on public.clubs (owner_group_id)
  where owner_group_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Bar counters + table/zone routing
-- ---------------------------------------------------------------------------
create table if not exists public.bar_counters (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  counter_name text not null,
  counter_code text not null,
  is_vip boolean not null default false,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  unique (venue_id, counter_code)
);

create index if not exists idx_bar_counters_venue
  on public.bar_counters (venue_id)
  where active_status = true;

-- Map numeric table indices (same convention as club_zones) → bar counter
create table if not exists public.bar_counter_table_map (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  counter_id uuid not null references public.bar_counters (id) on delete cascade,
  table_number int not null,
  unique (venue_id, table_number)
);

-- Staff (waiter / bartender) assigned to a bar counter for the shift
create table if not exists public.staff_bar_assignments (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  staff_id uuid not null,
  staff_name text not null,
  staff_role text not null check (staff_role in ('WAITER', 'BARTENDER', 'FLOOR_MANAGER', 'CAPTAIN')),
  assigned_counter_id uuid references public.bar_counters (id) on delete set null,
  assigned_zone_id uuid references public.club_zones (id) on delete set null,
  active_status boolean not null default true,
  logged_in_at timestamptz not null default now()
);

create index if not exists idx_staff_bar_active
  on public.staff_bar_assignments (venue_id, assigned_counter_id)
  where active_status = true;

alter table public.orders
  add column if not exists assigned_counter_id uuid references public.bar_counters (id),
  add column if not exists assigned_counter_name text;

create index if not exists idx_orders_assigned_counter
  on public.orders (assigned_counter_id)
  where assigned_counter_id is not null;

create or replace function public.resolve_bar_counter_for_table(
  p_venue_id uuid,
  p_table_number int
)
returns table (
  counter_id uuid,
  counter_name text,
  counter_code text,
  is_vip boolean
)
language sql
stable
as $$
  select bc.id, bc.counter_name, bc.counter_code, bc.is_vip
  from public.bar_counter_table_map m
  join public.bar_counters bc on bc.id = m.counter_id and bc.active_status = true
  where m.venue_id = p_venue_id
    and m.table_number = p_table_number
  limit 1;
$$;

-- Extend auto-route trigger: waiter + bar counter
create or replace function public.trg_orders_auto_route_waiter()
returns trigger
language plpgsql
as $$
declare
  v_table_id uuid;
  v_table_code text;
  v_table_num int;
  v_waiter_id uuid;
  v_waiter_name text;
  v_counter_id uuid;
  v_counter_name text;
begin
  select s.primary_table_id into v_table_id
  from public.active_sessions s
  where s.id = new.session_id;

  if v_table_id is not null then
    select t.table_code into v_table_code
    from public.club_tables t
    where t.id = v_table_id;

    v_table_num := public.table_code_number(v_table_code);

    if v_table_num is not null then
      select r.waiter_id, r.waiter_name
        into v_waiter_id, v_waiter_name
      from public.resolve_waiter_for_table(new.club_id, v_table_num) r;

      if v_waiter_id is not null then
        new.assigned_waiter_id := v_waiter_id;
        new.assigned_waiter_name := v_waiter_name;
      end if;

      select c.counter_id, c.counter_name
        into v_counter_id, v_counter_name
      from public.resolve_bar_counter_for_table(new.club_id, v_table_num) c;

      if v_counter_id is not null then
        new.assigned_counter_id := v_counter_id;
        new.assigned_counter_name := v_counter_name;
      end if;
    end if;
  end if;

  if new.token_number is not null and new.pickup_token_code is null then
    new.pickup_token_code := '#' || lpad(new.token_number::text, 4, '0');
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Flash campaigns + promo credit ledger
-- ---------------------------------------------------------------------------
create table if not exists public.flash_campaigns (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  category text not null,
  audience text not null check (audience in ('CHECKED_IN', 'GEO_GLOBAL')),
  duration_minutes int not null default 60,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  credit_cost numeric(12, 2) not null default 0,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'ENDED', 'CANCELLED')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_flash_campaigns_venue_active
  on public.flash_campaigns (venue_id, status, ends_at desc);

create table if not exists public.promo_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  delta numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  reason text not null,
  provider text check (provider is null or provider in ('RAZORPAY', 'CASHFREE', 'INTERNAL', 'FLASH_SPEND')),
  external_ref text,
  created_at timestamptz not null default now()
);

create or replace function public.spend_promo_credits(
  p_venue_id uuid,
  p_amount numeric,
  p_reason text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'Credit spend must be positive';
  end if;

  select credit_balance into v_balance
  from public.clubs
  where id = p_venue_id
  for update;

  if v_balance is null then
    raise exception 'Venue not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient promo credits (have %, need %)', v_balance, p_amount;
  end if;

  v_balance := v_balance - p_amount;

  update public.clubs
  set credit_balance = v_balance, updated_at = now()
  where id = p_venue_id;

  insert into public.promo_credit_ledger (venue_id, delta, balance_after, reason, provider)
  values (p_venue_id, -p_amount, v_balance, p_reason, 'FLASH_SPEND');

  return v_balance;
end;
$$;

create or replace function public.topup_promo_credits(
  p_venue_id uuid,
  p_amount numeric,
  p_provider text,
  p_external_ref text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'Top-up must be positive';
  end if;

  update public.clubs
  set credit_balance = credit_balance + p_amount, updated_at = now()
  where id = p_venue_id
  returning credit_balance into v_balance;

  if v_balance is null then
    raise exception 'Venue not found';
  end if;

  insert into public.promo_credit_ledger (
    venue_id, delta, balance_after, reason, provider, external_ref
  )
  values (
    p_venue_id, p_amount, v_balance,
    'Platform promo credit top-up', p_provider, p_external_ref
  );

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.bar_counters enable row level security;
alter table public.bar_counter_table_map enable row level security;
alter table public.staff_bar_assignments enable row level security;
alter table public.flash_campaigns enable row level security;
alter table public.promo_credit_ledger enable row level security;

drop policy if exists bar_counters_staff_read on public.bar_counters;
create policy bar_counters_staff_read on public.bar_counters
  for select using (
    public.current_user_role() = 'SUPER_ADMIN'
    or public.is_staff_of_club(venue_id)
  );

drop policy if exists bar_counters_admin_write on public.bar_counters;
create policy bar_counters_admin_write on public.bar_counters
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  )
  with check (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  );

drop policy if exists bar_map_staff_read on public.bar_counter_table_map;
create policy bar_map_staff_read on public.bar_counter_table_map
  for select using (
    public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id)
  );

drop policy if exists bar_map_admin_write on public.bar_counter_table_map;
create policy bar_map_admin_write on public.bar_counter_table_map
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  )
  with check (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  );

drop policy if exists staff_bar_staff_read on public.staff_bar_assignments;
create policy staff_bar_staff_read on public.staff_bar_assignments
  for select using (
    public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id)
  );

drop policy if exists staff_bar_manager_write on public.staff_bar_assignments;
create policy staff_bar_manager_write on public.staff_bar_assignments
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN', 'GATE_STAFF'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  )
  with check (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN', 'GATE_STAFF'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  );

drop policy if exists flash_campaigns_staff_read on public.flash_campaigns;
create policy flash_campaigns_staff_read on public.flash_campaigns
  for select using (
    public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id)
  );

drop policy if exists flash_campaigns_admin_write on public.flash_campaigns;
create policy flash_campaigns_admin_write on public.flash_campaigns
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  )
  with check (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  );

drop policy if exists promo_ledger_admin_read on public.promo_credit_ledger;
create policy promo_ledger_admin_read on public.promo_credit_ledger
  for select using (
    public.current_user_role() in ('SUPER_ADMIN', 'CLUB_ADMIN')
    and (public.current_user_role() = 'SUPER_ADMIN' or public.is_staff_of_club(venue_id))
  );

-- ---------------------------------------------------------------------------
-- 6. Seed: owner group, second venue, bar counters, starter credits
-- ---------------------------------------------------------------------------
do $$
declare
  v_group uuid := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  v_main uuid := '22222222-2222-2222-2222-222222222222';
  v_sky uuid := '22222222-2222-2222-2222-222222222224';
  v_main_bar uuid;
  v_vip_bar uuid;
  v_sky_bar uuid;
begin
  update public.clubs
  set
    owner_group_id = v_group,
    short_name = 'Neon District Main',
    credit_balance = greatest(credit_balance, 5000)
  where id = v_main;

  insert into public.clubs (
    id, name, location, lucky_draw_threshold_amount, active_promo_category,
    display_enabled, lucky_draw_enabled, prebook_buffer_minutes,
    subscription_tier, radius_config_m, owner_group_id, credit_balance, short_name
  )
  values (
    v_sky,
    'Neon Sky Lounge',
    st_setsrid(st_makepoint(72.8777, 19.086), 4326)::geography,
    1500, null, true, true, 30, 'ENTERPRISE', 1500,
    v_group, 2500, 'Neon Sky Lounge'
  )
  on conflict (id) do update set
    owner_group_id = excluded.owner_group_id,
    short_name = excluded.short_name,
    credit_balance = greatest(public.clubs.credit_balance, excluded.credit_balance);

  insert into public.bar_counters (id, venue_id, counter_name, counter_code, is_vip)
  values
    ('bc000000-0000-0000-0000-000000000001', v_main, 'Main Bar (Counter 1)', 'MAIN_1', false),
    ('bc000000-0000-0000-0000-000000000002', v_main, 'VIP Bar (Counter 2)', 'VIP_2', true),
    ('bc000000-0000-0000-0000-000000000003', v_sky, 'Sky Bar (Counter 1)', 'SKY_1', false)
  on conflict (venue_id, counter_code) do update set
    counter_name = excluded.counter_name,
    is_vip = excluded.is_vip,
    active_status = true;

  select id into v_main_bar from public.bar_counters
  where venue_id = v_main and counter_code = 'MAIN_1';
  select id into v_vip_bar from public.bar_counters
  where venue_id = v_main and counter_code = 'VIP_2';
  select id into v_sky_bar from public.bar_counters
  where venue_id = v_sky and counter_code = 'SKY_1';

  -- B1–B10 → Main Bar; V1–V3 (101–103) → VIP Bar
  insert into public.bar_counter_table_map (venue_id, counter_id, table_number)
  select v_main, v_main_bar, g
  from generate_series(1, 10) g
  on conflict (venue_id, table_number) do update set counter_id = excluded.counter_id;

  insert into public.bar_counter_table_map (venue_id, counter_id, table_number)
  select v_main, v_vip_bar, g
  from generate_series(101, 103) g
  on conflict (venue_id, table_number) do update set counter_id = excluded.counter_id;

  insert into public.bar_counter_table_map (venue_id, counter_id, table_number)
  select v_sky, v_sky_bar, g
  from generate_series(1, 12) g
  on conflict (venue_id, table_number) do update set counter_id = excluded.counter_id;

  -- Zones for Sky Lounge (idempotent)
  insert into public.club_zones (venue_id, zone_name, table_range)
  values
    (v_sky, 'Sky Floor', array[1,2,3,4,5,6,7,8,9,10,11,12])
  on conflict (venue_id, zone_name) do nothing;
end $$;
