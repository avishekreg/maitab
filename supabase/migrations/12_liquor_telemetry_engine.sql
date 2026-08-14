-- Liquor telemetry engine: consumption tracking + share-of-throat intelligence

create table if not exists public.consumption_telemetry (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  order_item_id uuid,
  brand_name text not null,
  parent_company text not null,
  spirit_category text not null,
  spirit_subtype text not null default 'Blended Scotch',
  volume_ml int not null default 30,
  billed_amount numeric not null,
  pour_cost_pct numeric(4,2) default 18.5,
  pour_hour int not null,
  zone_name text not null,
  created_at timestamptz default now()
);

alter table public.consumption_telemetry
  add column if not exists spirit_subtype text;

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
  count(*) as total_pours,
  sum(billed_amount) as total_revenue,
  round(
    (count(*)::decimal / nullif(sum(count(*)) over (partition by spirit_category), 0)) * 100,
    2
  ) as share_of_throat_pct
from public.consumption_telemetry
group by parent_company, spirit_category, brand_name;

insert into public.consumption_telemetry (
  venue_id, brand_name, parent_company, spirit_category, spirit_subtype,
  volume_ml, billed_amount, pour_cost_pct, pour_hour, zone_name, created_at
)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  b.brand_name,
  b.parent_company,
  b.spirit_category,
  b.spirit_subtype,
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
      ('Johnnie Walker', 'Diageo', 'Whisky', 'Blended Scotch', 30, 450),
      ('Talisker', 'Diageo', 'Whisky', 'Single Malt', 30, 890),
      ('Maker''s Mark', 'Beam Suntory', 'Whisky', 'Bourbon', 30, 620),
      ('Grey Goose', 'Pernod Ricard', 'Vodka', 'Premium Wheat', 30, 520),
      ('Don Julio Blanco', 'Diageo', 'Tequila', 'Blanco Tequila', 30, 680),
      ('Patrón Reposado', 'Bacardi', 'Tequila', 'Reposado', 30, 920),
      ('Bombay Sapphire', 'Bacardi', 'Gin', 'Botanical Gin', 30, 480),
      ('Kingfisher Ultra', 'AB InBev', 'Beer', 'Draught Lager', 330, 320)
  ) as t(brand_name, parent_company, spirit_category, spirit_subtype, volume_ml, billed_amount)
  offset (g % 8)
  limit 1
) b
on conflict do nothing;
