-- Phase 6: External Deal Bridge + strict mutual exclusivity
-- Run after 01–04 on an existing project (safe to re-run).

do $$ begin
  create type public.external_provider as enum (
    'ZOMATO_DISTRICT',
    'SWIGGY_DINEOUT',
    'EAZYDINER',
    'DIRECT',
    'NONE'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.discount_status as enum (
    'PENDING_VERIFICATION',
    'APPROVED',
    'REJECTED'
  );
exception when duplicate_object then null;
end $$;

alter table public.active_sessions
  add column if not exists external_provider public.external_provider
    not null default 'NONE';

alter table public.active_sessions
  add column if not exists external_voucher_code text;

alter table public.active_sessions
  add column if not exists discount_percentage numeric(5,2)
    not null default 0
    check (discount_percentage >= 0 and discount_percentage <= 100);

alter table public.active_sessions
  add column if not exists discount_status public.discount_status;

alter table public.active_sessions
  add column if not exists discount_verified_by uuid
    references public.users (id) on delete set null;

alter table public.active_sessions
  add column if not exists is_native_promos_eligible boolean
    not null default true;

comment on column public.active_sessions.external_provider is
  'Third-party deal bridge source (Zomato / Swiggy / EazyDiner / Direct).';
comment on column public.active_sessions.is_native_promos_eligible is
  'FALSE when an external deal is APPROVED — blocks lucky draw + native flash promos.';

-- Enforce exclusivity whenever an external deal is approved
create or replace function public.enforce_external_discount_exclusivity()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.discount_status = 'APPROVED'
     and new.external_provider is distinct from 'NONE'
  then
    new.is_native_promos_eligible := false;
    new.is_lucky_draw_eligible := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_external_discount_exclusivity on public.active_sessions;
create trigger trg_external_discount_exclusivity
before insert or update of discount_status, external_provider
on public.active_sessions
for each row
execute function public.enforce_external_discount_exclusivity();

-- Lucky draw pool: never pick external-deal sessions
create or replace function public.run_hourly_lucky_draw(p_club_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
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
    and s.is_native_promos_eligible = true
    and coalesce(s.discount_status::text, '') is distinct from 'APPROVED'
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

-- Spend recalc must respect native promo lock
create or replace function public.recalculate_session_spend(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_total numeric(12,2);
  v_threshold numeric(12,2);
  v_is_vip boolean;
  v_native boolean;
  v_status public.discount_status;
begin
  select
    coalesce((
      select sum(o.total_amount)
      from public.orders o
      where o.session_id = p_session_id
    ), 0),
    s.is_vip,
    c.lucky_draw_threshold_amount,
    s.is_native_promos_eligible,
    s.discount_status
  into v_total, v_is_vip, v_threshold, v_native, v_status
  from public.active_sessions s
  join public.clubs c on c.id = s.club_id
  where s.id = p_session_id;

  update public.active_sessions
  set
    total_session_spend = coalesce(v_total, 0),
    is_lucky_draw_eligible = (
      coalesce(v_total, 0) >= v_threshold
      and not v_is_vip
      and coalesce(v_native, true)
      and coalesce(v_status::text, '') is distinct from 'APPROVED'
    )
  where id = p_session_id;
end;
$$;

-- Guest requests external voucher link
create or replace function public.request_external_discount(
  p_session_id uuid,
  p_provider public.external_provider,
  p_voucher_code text,
  p_discount_percentage numeric default null
)
returns public.active_sessions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.active_sessions;
  v_pct numeric(5,2);
begin
  if p_provider in ('NONE') then
    raise exception 'provider required';
  end if;

  if nullif(trim(p_voucher_code), '') is null then
    raise exception 'voucher code required';
  end if;

  v_pct := coalesce(
    p_discount_percentage,
    case p_provider
      when 'ZOMATO_DISTRICT' then 20
      when 'SWIGGY_DINEOUT' then 20
      when 'EAZYDINER' then 15
      when 'DIRECT' then 10
      else 0
    end
  );

  update public.active_sessions
  set
    external_provider = p_provider,
    external_voucher_code = upper(trim(p_voucher_code)),
    discount_percentage = v_pct,
    discount_status = 'PENDING_VERIFICATION',
    discount_verified_by = null
    -- keep native eligible until staff APPROVES (conversion hook stays open)
  where id = p_session_id
    and status = 'ACTIVE'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'active session not found';
  end if;

  return v_row;
end;
$$;

-- Staff approves + locks native promos
create or replace function public.approve_external_discount(
  p_session_id uuid,
  p_staff_user_id uuid,
  p_discount_percentage numeric default null
)
returns public.active_sessions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.active_sessions;
begin
  update public.active_sessions
  set
    discount_status = 'APPROVED',
    discount_percentage = coalesce(p_discount_percentage, discount_percentage),
    discount_verified_by = p_staff_user_id,
    is_native_promos_eligible = false,
    is_lucky_draw_eligible = false
  where id = p_session_id
    and status = 'ACTIVE'
    and discount_status = 'PENDING_VERIFICATION'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'no pending external discount for session';
  end if;

  return v_row;
end;
$$;

create or replace function public.reject_external_discount(
  p_session_id uuid,
  p_staff_user_id uuid
)
returns public.active_sessions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.active_sessions;
begin
  update public.active_sessions
  set
    discount_status = 'REJECTED',
    discount_verified_by = p_staff_user_id,
    external_provider = 'NONE',
    external_voucher_code = null,
    discount_percentage = 0,
    is_native_promos_eligible = true
  where id = p_session_id
    and status = 'ACTIVE'
    and discount_status = 'PENDING_VERIFICATION'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'no pending external discount for session';
  end if;

  return v_row;
end;
$$;

-- Can this session receive a native flash/category promo?
create or replace function public.session_can_use_native_promos(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.active_sessions s
    where s.id = p_session_id
      and s.status = 'ACTIVE'
      and s.is_native_promos_eligible = true
      and coalesce(s.discount_status::text, '') is distinct from 'APPROVED'
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'active_sessions'
  ) then
    alter publication supabase_realtime add table public.active_sessions;
  end if;
end $$;
