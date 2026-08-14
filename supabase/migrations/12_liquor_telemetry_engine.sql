-- Liquor telemetry engine: consumption tracking + share-of-throat intelligence

create table if not exists public.consumption_telemetry (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  order_item_id uuid,
  brand_name text not null,
  parent_company text not null
    check (parent_company in (
      'Diageo', 'Pernod Ricard', 'Bacardi', 'AB InBev', 'Beam Suntory'
    )),
  spirit_category text not null
    check (spirit_category in ('Whisky', 'Vodka', 'Tequila', 'Gin', 'Beer', 'Wine')),
  volume_ml int not null default 30,
  billed_amount numeric not null,
  pour_cost_pct numeric(4,2) not null default 18.5,
  pour_hour int not null check (pour_hour between 0 and 23),
  zone_name text not null
    check (zone_name in ('VIP Lounge', 'Main Floor', 'Rooftop Bar')),
  created_at timestamptz not null default now()
);

create index if not exists idx_consumption_venue on public.consumption_telemetry(venue_id);
create index if not exists idx_consumption_hour on public.consumption_telemetry(pour_hour);
create index if not exists idx_consumption_brand on public.consumption_telemetry(parent_company, spirit_category);

alter table public.consumption_telemetry enable row level security;

drop policy if exists consumption_telemetry_read on public.consumption_telemetry;
create policy consumption_telemetry_read on public.consumption_telemetry
  for select using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
  );

create or replace view public.v_brand_share_of_throat as
select
  parent_company,
  spirit_category,
  brand_name,
  count(*)::int as total_pours,
  sum(billed_amount)::numeric as total_revenue,
  round(
    (sum(volume_ml)::numeric / nullif(sum(sum(volume_ml)) over (partition by spirit_category), 0)) * 100,
    2
  ) as share_of_throat_pct
from public.consumption_telemetry
group by parent_company, spirit_category, brand_name;

insert into public.consumption_telemetry (
  venue_id, brand_name, parent_company, spirit_category,
  volume_ml, billed_amount, pour_cost_pct, pour_hour, zone_name, created_at
)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  b.brand_name,
  b.parent_company,
  b.spirit_category,
  b.volume_ml,
  b.billed_amount + ((g % 7) * 10),
  round((17.2 + ((g % 9) * 0.35))::numeric, 2),
  (array[20, 21, 22, 23, 0, 1, 2, 3, 4])[1 + (g % 9)],
  (array['VIP Lounge', 'Main Floor', 'Rooftop Bar'])[1 + (g % 3)],
  now() - ((g % 6) || ' hours')::interval
from generate_series(1, 150) as g
cross join lateral (
  select *
  from (
    values
      ('Johnnie Walker', 'Diageo', 'Whisky', 30, 450),
      ('Grey Goose', 'Pernod Ricard', 'Vodka', 30, 520),
      ('Don Julio Blanco', 'Diageo', 'Tequila', 30, 680),
      ('Bombay Sapphire', 'Bacardi', 'Gin', 30, 480),
      ('Kingfisher Ultra', 'AB InBev', 'Beer', 330, 320)
  ) as t(brand_name, parent_company, spirit_category, volume_ml, billed_amount)
  offset (g % 5)
  limit 1
) b
on conflict do nothing;
