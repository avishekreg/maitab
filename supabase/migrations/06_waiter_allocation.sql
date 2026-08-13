-- Waiter Zone Allocation Engine & live order routing
-- (Runs alongside 06_order_handshakes.sql — filename matches product spec.)

-- 1. Club Zones
create table if not exists public.club_zones (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  zone_name text not null,
  table_range int[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (venue_id, zone_name)
);

create index if not exists idx_club_zones_venue
  on public.club_zones (venue_id);

-- 2. Active Waiter Shift Allocations
create table if not exists public.waiter_shifts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  waiter_id uuid not null,
  waiter_name text not null,
  assigned_zone_id uuid references public.club_zones (id) on delete set null,
  active_status boolean not null default true,
  logged_in_at timestamptz not null default now()
);

create index if not exists idx_waiter_shifts_active_zone
  on public.waiter_shifts (venue_id, assigned_zone_id)
  where active_status = true;

-- 3. Waiter routing columns on orders
alter table public.orders
  add column if not exists assigned_waiter_id uuid,
  add column if not exists assigned_waiter_name text,
  add column if not exists pickup_token_code text;

create index if not exists idx_orders_assigned_waiter
  on public.orders (assigned_waiter_id)
  where assigned_waiter_id is not null;

-- Extract numeric table index from codes like B4 / V1 / 12
-- VIP (V*) maps to 100+n so V1 never collides with B1
create or replace function public.table_code_number(p_code text)
returns int
language sql
immutable
as $$
  select case
    when nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '') is null
      then null
    when upper(coalesce(p_code, '')) ~ '^V'
      then 100 + regexp_replace(p_code, '\D', '', 'g')::int
    else regexp_replace(p_code, '\D', '', 'g')::int
  end;
$$;

-- Resolve active waiter for a table number inside a venue
create or replace function public.resolve_waiter_for_table(
  p_venue_id uuid,
  p_table_number int
)
returns table (
  waiter_id uuid,
  waiter_name text,
  zone_id uuid,
  zone_name text
)
language sql
stable
as $$
  select
    ws.waiter_id,
    ws.waiter_name,
    cz.id as zone_id,
    cz.zone_name
  from public.club_zones cz
  join public.waiter_shifts ws
    on ws.assigned_zone_id = cz.id
   and ws.venue_id = cz.venue_id
   and ws.active_status = true
  where cz.venue_id = p_venue_id
    and p_table_number = any (cz.table_range)
  order by ws.logged_in_at asc
  limit 1;
$$;

-- Auto-route on order insert: zone → active waiter + pickup token
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
    end if;
  end if;

  if new.token_number is not null and new.pickup_token_code is null then
    new.pickup_token_code := '#' || lpad(new.token_number::text, 4, '0');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_auto_route_waiter on public.orders;
create trigger trg_orders_auto_route_waiter
before insert on public.orders
for each row
execute function public.trg_orders_auto_route_waiter();

-- Keep pickup_token_code in sync when token_number is set by existing token trigger
create or replace function public.trg_orders_pickup_token_sync()
returns trigger
language plpgsql
as $$
begin
  if new.token_number is not null then
    new.pickup_token_code := '#' || lpad(new.token_number::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_pickup_token_sync on public.orders;
create trigger trg_orders_pickup_token_sync
before insert or update of token_number on public.orders
for each row
execute function public.trg_orders_pickup_token_sync();

-- RLS
alter table public.club_zones enable row level security;
alter table public.waiter_shifts enable row level security;

drop policy if exists club_zones_staff_read on public.club_zones;
create policy club_zones_staff_read on public.club_zones
  for select
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'BARTENDER', 'GATE_STAFF', 'CLUB_ADMIN', 'SUPER_ADMIN'
    )
  );

drop policy if exists club_zones_admin_write on public.club_zones;
create policy club_zones_admin_write on public.club_zones
  for all
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'CLUB_ADMIN', 'SUPER_ADMIN'
    )
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'CLUB_ADMIN', 'SUPER_ADMIN'
    )
  );

drop policy if exists waiter_shifts_staff_read on public.waiter_shifts;
create policy waiter_shifts_staff_read on public.waiter_shifts
  for select
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'BARTENDER', 'GATE_STAFF', 'CLUB_ADMIN', 'SUPER_ADMIN'
    )
  );

drop policy if exists waiter_shifts_staff_write on public.waiter_shifts;
create policy waiter_shifts_staff_write on public.waiter_shifts
  for all
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'GATE_STAFF', 'CLUB_ADMIN', 'SUPER_ADMIN', 'BARTENDER'
    )
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'GATE_STAFF', 'CLUB_ADMIN', 'SUPER_ADMIN', 'BARTENDER'
    )
  );

-- Seed Neon District demo zones (idempotent by zone_name)
-- Main Floor = B1–B10; VIP Lounge = V1–V3 → 101–103
insert into public.club_zones (venue_id, zone_name, table_range)
select c.id, z.zone_name, z.table_range
from public.clubs c
cross join (
  values
    ('Main Floor', array[1,2,3,4,5,6,7,8,9,10]),
    ('VIP Lounge', array[101,102,103])
) as z(zone_name, table_range)
where c.name ilike '%neon%'
on conflict (venue_id, zone_name) do update
  set table_range = excluded.table_range;
