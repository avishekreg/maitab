-- Enterprise hardening: platform_config vault, compliance licenses, staff CRUD
-- Compatible with existing schema: menu_items already uses club_id (01_schema.sql)

-- 1. No-code platform config (Super Admin vault)
create table if not exists public.platform_config (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  config_group text not null default 'GLOBAL_KEYS'
    check (config_group in (
      'API_ENDPOINTS', 'WEBHOOK_URLS', 'COMMISSION_RATES',
      'GLOBAL_KEYS', 'PAYMENT_GATEWAY_CREDENTIALS'
    )),
  label text not null,
  value_encrypted text not null default '',
  is_secret boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.platform_config enable row level security;

drop policy if exists platform_config_super_read on public.platform_config;
create policy platform_config_super_read on public.platform_config
  for select using (public.current_user_role()::text = 'SUPER_ADMIN');

drop policy if exists platform_config_super_write on public.platform_config;
create policy platform_config_super_write on public.platform_config
  for all using (public.current_user_role()::text = 'SUPER_ADMIN')
  with check (public.current_user_role()::text = 'SUPER_ADMIN');

insert into public.platform_config (config_key, config_group, label, value_encrypted, is_secret)
values
  ('SETTLEMENT_GATEWAY_PRIMARY', 'PAYMENT_GATEWAY_CREDENTIALS', 'Primary Settlement Gateway Key', '', true),
  ('SETTLEMENT_GATEWAY_SECONDARY', 'PAYMENT_GATEWAY_CREDENTIALS', 'Secondary Settlement Gateway Key', '', true),
  ('WEBHOOK_ORDERS', 'WEBHOOK_URLS', 'Orders Webhook URL', '', false),
  ('WEBHOOK_SETTLEMENT', 'WEBHOOK_URLS', 'Settlement Webhook URL', '', false),
  ('API_KDS_BASE', 'API_ENDPOINTS', 'KDS API Base URL', '', false),
  ('COMMISSION_STARTER_PCT', 'COMMISSION_RATES', 'Starter GMV Commission %', '1.5', false),
  ('COMMISSION_PRO_PCT', 'COMMISSION_RATES', 'Pro GMV Commission %', '1.0', false),
  ('PLATFORM_MASTER_PIN_HINT', 'GLOBAL_KEYS', 'Vault 2FA PIN Hint', 'Set via vault UI', true)
on conflict (config_key) do nothing;

-- 2. Compliance / license columns on clubs (product copy says "venue")
alter table public.clubs
  add column if not exists liquor_license_url text,
  add column if not exists liquor_license_expiry date,
  add column if not exists fssai_license_url text,
  add column if not exists fssai_license_expiry date,
  add column if not exists gstin text;

alter table public.clubs
  add column if not exists compliance_status text;

update public.clubs
set compliance_status = 'ACTIVE'
where compliance_status is null;

alter table public.clubs
  alter column compliance_status set default 'ACTIVE';

alter table public.clubs
  alter column compliance_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clubs_compliance_status_check'
      and conrelid = 'public.clubs'::regclass
  ) then
    alter table public.clubs
      add constraint clubs_compliance_status_check
      check (compliance_status in ('ACTIVE', 'WARNING', 'SUSPENDED'));
  end if;
end $$;

create or replace function public.refresh_club_compliance(p_club_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clubs c
  set compliance_status = case
    when (
      (c.liquor_license_expiry is not null and c.liquor_license_expiry < current_date)
      or (c.fssai_license_expiry is not null and c.fssai_license_expiry < current_date)
    ) then 'SUSPENDED'
    when (
      (c.liquor_license_expiry is not null and c.liquor_license_expiry <= current_date + 15)
      or (c.fssai_license_expiry is not null and c.fssai_license_expiry <= current_date + 15)
    ) then 'WARNING'
    else 'ACTIVE'
  end,
  updated_at = now()
  where p_club_id is null or c.id = p_club_id;
end;
$$;

create or replace function public.trg_clubs_compliance_refresh()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_club_compliance(new.id);
  return new;
end;
$$;

drop trigger if exists trg_clubs_compliance_refresh on public.clubs;
create trigger trg_clubs_compliance_refresh
after insert or update of liquor_license_expiry, fssai_license_expiry
on public.clubs
for each row execute function public.trg_clubs_compliance_refresh();

-- 3. Staff profiles for Floor Manager CRUD (club_id matches core schema)
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  full_name text not null,
  staff_role text not null check (staff_role in ('WAITER', 'BARTENDER', 'FLOOR_MANAGER', 'CAPTAIN', 'GATE_STAFF')),
  phone text,
  active_status boolean not null default true,
  created_at timestamptz not null default now()
);

-- If an earlier broken run created staff_profiles with venue_id, rename it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff_profiles'
      and column_name = 'venue_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff_profiles'
      and column_name = 'club_id'
  ) then
    alter table public.staff_profiles rename column venue_id to club_id;
  end if;
end $$;

create index if not exists idx_staff_profiles_club
  on public.staff_profiles (club_id, staff_role);

alter table public.staff_profiles enable row level security;

drop policy if exists staff_profiles_staff_rw on public.staff_profiles;
create policy staff_profiles_staff_rw on public.staff_profiles
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role()::text = 'SUPER_ADMIN' or public.is_staff_of_club(club_id))
  )
  with check (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
    and (public.current_user_role()::text = 'SUPER_ADMIN' or public.is_staff_of_club(club_id))
  );

-- 4. menu_items already exists (club_id) — harden columns + RLS only
alter table public.menu_items
  add column if not exists active_status boolean;

update public.menu_items
set active_status = coalesce(is_available, true)
where active_status is null;

alter table public.menu_items
  alter column active_status set default true;

alter table public.menu_items
  alter column active_status set not null;

create index if not exists idx_menu_items_club on public.menu_items (club_id);

alter table public.menu_items enable row level security;

-- Drop policies from a failed prior run that referenced venue_id
drop policy if exists menu_items_admin_rw on public.menu_items;
drop policy if exists menu_items_staff_read on public.menu_items;
drop index if exists idx_menu_items_venue;

-- Keep public read; tighten admin write (idempotent with 01_schema policies)
drop policy if exists menu_admin_write on public.menu_items;
create policy menu_admin_write on public.menu_items
for all using (
  public.current_user_role()::text in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and (
    public.current_user_role()::text = 'SUPER_ADMIN'
    or public.is_staff_of_club(club_id)
  )
)
with check (
  public.current_user_role()::text in ('SUPER_ADMIN', 'CLUB_ADMIN')
  and (
    public.current_user_role()::text = 'SUPER_ADMIN'
    or public.is_staff_of_club(club_id)
  )
);

-- 5. SaaS onboarding leads
create table if not exists public.saas_onboarding (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('STARTER', 'PRO', 'ENTERPRISE')),
  venue_name text not null,
  admin_email text not null,
  admin_name text not null,
  phone text,
  payment_ref text,
  status text not null default 'PENDING_PAYMENT'
    check (status in ('PENDING_PAYMENT', 'PAID', 'KYC_PENDING', 'ACTIVE')),
  club_id uuid references public.clubs (id),
  created_at timestamptz not null default now()
);

alter table public.saas_onboarding enable row level security;

drop policy if exists saas_onboarding_super on public.saas_onboarding;
create policy saas_onboarding_super on public.saas_onboarding
  for all using (public.current_user_role()::text = 'SUPER_ADMIN')
  with check (public.current_user_role()::text = 'SUPER_ADMIN');

-- Refresh compliance for existing clubs once
select public.refresh_club_compliance(null);
