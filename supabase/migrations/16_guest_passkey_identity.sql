-- 16 · Hybrid guest identity: permanent passkey profile + nightly attachment
-- Layer 1 extends users; guest_profiles supports passkey-only guests without auth.users.
-- Layer 2 extends active_sessions with guest_profile_id + night status aliases.

-- ---------------------------------------------------------------------------
-- Layer 1: Permanent guest fields on public.users
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists email text;

alter table public.users
  add column if not exists passkey_credential_id text;

alter table public.users
  add column if not exists passkey_public_key text;

alter table public.users
  add column if not exists passkey_counter bigint not null default 0;

alter table public.users
  add column if not exists loyalty_points integer not null default 0
    check (loyalty_points >= 0);

alter table public.users
  add column if not exists lifetime_spend numeric(14,2) not null default 0
    check (lifetime_spend >= 0);

do $$ begin
  create type public.vip_tier as enum ('STANDARD', 'GOLD', 'BLACK_DIAMOND');
exception when duplicate_object then null;
end $$;

alter table public.users
  add column if not exists vip_tier public.vip_tier not null default 'STANDARD';

-- Allow passkey-first guests without phone (unique still allows multiple nulls in PG)
alter table public.users
  alter column phone_number drop not null;

create unique index if not exists users_passkey_credential_id_uidx
  on public.users (passkey_credential_id)
  where passkey_credential_id is not null;

-- ---------------------------------------------------------------------------
-- Passkey-only guest profiles (no auth.users FK) — used by WebAuthn path
-- ---------------------------------------------------------------------------
create table if not exists public.guest_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default 'Guest',
  phone text,
  email text,
  passkey_credential_id text unique,
  passkey_public_key text,
  passkey_counter bigint not null default 0,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  lifetime_spend numeric(14,2) not null default 0 check (lifetime_spend >= 0),
  vip_tier public.vip_tier not null default 'STANDARD',
  lifetime_visits integer not null default 0 check (lifetime_visits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_profiles_passkey_idx
  on public.guest_profiles (passkey_credential_id)
  where passkey_credential_id is not null;

-- ---------------------------------------------------------------------------
-- Layer 2: Nightly attachment extensions
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.session_status add value 'SETTLING';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.session_status add value 'ABANDONED';
exception when duplicate_object then null;
end $$;

-- OPEN ≈ ACTIVE (existing); CLOSED ≈ COMPLETED (existing)

alter table public.active_sessions
  add column if not exists guest_profile_id uuid
    references public.guest_profiles (id) on delete set null;

create index if not exists active_sessions_guest_profile_idx
  on public.active_sessions (guest_profile_id)
  where guest_profile_id is not null;

-- ---------------------------------------------------------------------------
-- Layer 3: Lifetime night history (orders already carry user_id + club_id)
-- ---------------------------------------------------------------------------
create table if not exists public.guest_night_history (
  id uuid primary key default gen_random_uuid(),
  guest_profile_id uuid references public.guest_profiles (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  club_id uuid not null references public.clubs (id) on delete cascade,
  club_name text not null,
  table_code text not null,
  session_id uuid,
  spend_amount numeric(14,2) not null default 0,
  status text not null default 'SETTLED'
    check (status in ('SETTLED', 'OPEN', 'ABANDONED')),
  saarthi_trip_id uuid,
  night_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists guest_night_history_guest_idx
  on public.guest_night_history (guest_profile_id, night_at desc);

create index if not exists guest_night_history_user_idx
  on public.guest_night_history (user_id, night_at desc);

alter table public.guest_profiles enable row level security;
alter table public.guest_night_history enable row level security;

-- Service role / demo admin client bypasses RLS; policies for authenticated customers later.
