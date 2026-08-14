-- Minimum Guarantee (MG) vs GMV take-rate offset billing
-- Uses clubs (product copy: venues). plan defaults: Starter ₹19,999 / 10%, Pro ₹29,999 / 8%.

create table if not exists public.platform_plans (
  id text primary key,
  plan_name text not null,
  default_base_mg numeric(12, 2) not null,
  default_gmv_percent numeric(6, 2) not null,
  features jsonb not null default '{}'::jsonb
);

insert into public.platform_plans (id, plan_name, default_base_mg, default_gmv_percent, features)
values
  (
    'starter',
    'Starter · Single Venue',
    19999,
    10.0,
    '{"venues":1,"routing":false,"flash":"basic"}'::jsonb
  ),
  (
    'pro',
    'Pro · Multi-Venue & Routing',
    29999,
    8.0,
    '{"venues":"multi","routing":true,"flash":"geo"}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise Group · Annual SLA',
    0,
    0,
    '{"venues":"group","sla":true,"custom":true}'::jsonb
  )
on conflict (id) do update set
  plan_name = excluded.plan_name,
  default_base_mg = excluded.default_base_mg,
  default_gmv_percent = excluded.default_gmv_percent,
  features = excluded.features;

alter table public.clubs
  add column if not exists plan_id text references public.platform_plans (id) default 'starter',
  add column if not exists custom_base_mg numeric(12, 2),
  add column if not exists custom_gmv_percent numeric(6, 2),
  add column if not exists is_custom_deal boolean not null default false;

update public.clubs
set plan_id = case
  when subscription_tier = 'ENTERPRISE' then 'enterprise'
  when subscription_tier = 'GROWTH' then 'pro'
  else 'starter'
end
where plan_id is null;

create table if not exists public.club_monthly_invoices (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.clubs (id) on delete cascade,
  billing_month date not null,
  total_gmv numeric(14, 2) not null default 0,
  effective_base_mg numeric(12, 2) not null,
  effective_gmv_percent numeric(6, 2) not null,
  calculated_gmv_cut numeric(14, 2) not null,
  final_payable_amount numeric(14, 2) not null,
  invoice_status text not null default 'PENDING'
    check (invoice_status in ('PENDING', 'ISSUED', 'PAID', 'WAIVED')),
  created_at timestamptz not null default now(),
  unique (venue_id, billing_month)
);

create index if not exists idx_club_monthly_invoices_venue_month
  on public.club_monthly_invoices (venue_id, billing_month desc);

-- Effective rates: custom deal wins over plan defaults
create or replace function public.club_effective_billing(p_club_id uuid)
returns table (
  plan_id text,
  effective_base_mg numeric,
  effective_gmv_percent numeric,
  is_custom_deal boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(c.plan_id, 'starter') as plan_id,
    coalesce(
      case when c.is_custom_deal then c.custom_base_mg end,
      p.default_base_mg,
      19999
    ) as effective_base_mg,
    coalesce(
      case when c.is_custom_deal then c.custom_gmv_percent end,
      p.default_gmv_percent,
      10
    ) as effective_gmv_percent,
    coalesce(c.is_custom_deal, false) as is_custom_deal
  from public.clubs c
  left join public.platform_plans p on p.id = coalesce(c.plan_id, 'starter')
  where c.id = p_club_id;
$$;

-- MG vs GMV offset: final = GREATEST(base_mg, gmv * percent / 100)
create or replace function public.compute_mg_gmv_invoice(
  p_venue_id uuid,
  p_billing_month date,
  p_total_gmv numeric
)
returns public.club_monthly_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mg numeric;
  v_pct numeric;
  v_cut numeric;
  v_final numeric;
  v_row public.club_monthly_invoices;
begin
  select effective_base_mg, effective_gmv_percent
    into v_mg, v_pct
  from public.club_effective_billing(p_venue_id);

  v_mg := coalesce(v_mg, 0);
  v_pct := coalesce(v_pct, 0);
  v_cut := round(coalesce(p_total_gmv, 0) * v_pct / 100.0, 2);
  v_final := greatest(v_mg, v_cut);

  insert into public.club_monthly_invoices (
    venue_id,
    billing_month,
    total_gmv,
    effective_base_mg,
    effective_gmv_percent,
    calculated_gmv_cut,
    final_payable_amount,
    invoice_status
  )
  values (
    p_venue_id,
    date_trunc('month', p_billing_month)::date,
    coalesce(p_total_gmv, 0),
    v_mg,
    v_pct,
    v_cut,
    v_final,
    'PENDING'
  )
  on conflict (venue_id, billing_month) do update set
    total_gmv = excluded.total_gmv,
    effective_base_mg = excluded.effective_base_mg,
    effective_gmv_percent = excluded.effective_gmv_percent,
    calculated_gmv_cut = excluded.calculated_gmv_cut,
    final_payable_amount = excluded.final_payable_amount
  returning * into v_row;

  return v_row;
end;
$$;

alter table public.platform_plans enable row level security;
alter table public.club_monthly_invoices enable row level security;

drop policy if exists platform_plans_read on public.platform_plans;
create policy platform_plans_read on public.platform_plans
  for select using (true);

drop policy if exists platform_plans_super_write on public.platform_plans;
create policy platform_plans_super_write on public.platform_plans
  for all using (public.current_user_role()::text = 'SUPER_ADMIN')
  with check (public.current_user_role()::text = 'SUPER_ADMIN');

drop policy if exists club_invoices_super on public.club_monthly_invoices;
create policy club_invoices_super on public.club_monthly_invoices
  for all using (public.current_user_role()::text = 'SUPER_ADMIN')
  with check (public.current_user_role()::text = 'SUPER_ADMIN');

drop policy if exists club_invoices_admin_read on public.club_monthly_invoices;
create policy club_invoices_admin_read on public.club_monthly_invoices
  for select using (
    public.current_user_role()::text = 'SUPER_ADMIN'
    or public.is_staff_of_club(venue_id)
  );
