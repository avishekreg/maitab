-- Multi-tier liquor taxonomy: families + trade subcategories

alter table public.consumption_telemetry
  add column if not exists spirit_subcategory text;

alter table public.consumption_telemetry
  drop constraint if exists consumption_telemetry_spirit_category_check;

alter table public.consumption_telemetry
  add constraint consumption_telemetry_spirit_category_check
  check (spirit_category in (
    'Whisky',
    'Tequila & Mezcal',
    'Vodka',
    'Gin',
    'Rum',
    'Beer & Cider',
    'Wine & Champagne',
    'Tequila',
    'Beer',
    'Wine'
  ));

alter table public.consumption_telemetry
  drop constraint if exists consumption_telemetry_spirit_subcategory_check;

alter table public.consumption_telemetry
  add constraint consumption_telemetry_spirit_subcategory_check
  check (
    spirit_subcategory is null or spirit_subcategory in (
      'Single Malt Scotch', 'Blended Scotch', 'Bourbon', 'Irish Whiskey', 'Indian Craft Single Malt',
      'Blanco', 'Reposado', 'Añejo', 'Artisanal Mezcal',
      'Premium Wheat', 'Potato', 'Flavored Craft',
      'London Dry', 'Botanical Craft', 'Contemporary Pink',
      'Dark Aged', 'Spiced', 'White/Agricole',
      'Draught/Craft Taps', 'Premium Imported Lager', 'Stout', 'Hard Seltzer',
      'Brut Champagne', 'Prosecco', 'Still Red/White'
    )
  );

update public.consumption_telemetry
set spirit_category = case spirit_category
  when 'Tequila' then 'Tequila & Mezcal'
  when 'Beer' then 'Beer & Cider'
  when 'Wine' then 'Wine & Champagne'
  else spirit_category
end
where spirit_category in ('Tequila', 'Beer', 'Wine');

update public.consumption_telemetry
set spirit_subcategory = coalesce(spirit_subcategory,
  case
    when brand_name ilike '%walker%' then 'Blended Scotch'
    when brand_name ilike '%goose%' then 'Premium Wheat'
    when brand_name ilike '%julio%' then 'Blanco'
    when brand_name ilike '%bombay%' then 'London Dry'
    when brand_name ilike '%kingfisher%' then 'Premium Imported Lager'
    else 'Blended Scotch'
  end
);

create or replace view public.v_brand_share_of_throat as
select
  parent_company,
  spirit_category,
  spirit_subcategory,
  brand_name,
  count(*)::int as total_pours,
  sum(billed_amount)::numeric as total_revenue,
  round(
    (sum(volume_ml)::numeric / nullif(sum(sum(volume_ml)) over (partition by spirit_category), 0)) * 100,
    2
  ) as share_of_throat_pct
from public.consumption_telemetry
group by parent_company, spirit_category, spirit_subcategory, brand_name;

insert into public.consumption_telemetry (
  venue_id, brand_name, parent_company, spirit_category, spirit_subcategory,
  volume_ml, billed_amount, pour_cost_pct, pour_hour, zone_name, created_at
)
select
  (array[
    '22222222-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222224'::uuid,
    '22222222-2222-2222-2222-222222222223'::uuid
  ])[1 + (g % 3)],
  b.brand_name,
  b.parent_company,
  b.spirit_category,
  b.spirit_subcategory,
  b.volume_ml,
  b.billed_amount + ((g % 7) * 12),
  round((16.4 + ((g % 11) * 0.28))::numeric, 2),
  (array[20, 22, 23, 0, 1, 1, 2, 3, 4])[1 + (g % 9)],
  (array['VIP Lounge', 'Main Floor', 'Rooftop Bar'])[1 + (g % 3)],
  now() - ((g % 8) || ' hours')::interval
from generate_series(1, 200) as g
cross join lateral (
  select *
  from (
    values
      ('Talisker', 'Diageo', 'Whisky', 'Single Malt Scotch', 30, 890),
      ('Don Julio', 'Diageo', 'Tequila & Mezcal', 'Añejo', 30, 1850),
      ('Grey Goose', 'Pernod Ricard', 'Vodka', 'Premium Wheat', 30, 520),
      ('Patrón', 'Bacardi', 'Tequila & Mezcal', 'Reposado', 30, 920),
      ('Bombay Sapphire', 'Bacardi', 'Gin', 'London Dry', 30, 480),
      ('Kingfisher Ultra', 'AB InBev', 'Beer & Cider', 'Premium Imported Lager', 330, 320),
      ('Guinness', 'Diageo', 'Beer & Cider', 'Stout', 440, 420),
      ('G.H. Mumm', 'Pernod Ricard', 'Wine & Champagne', 'Brut Champagne', 150, 1400),
      ('Amrut', 'Diageo', 'Whisky', 'Indian Craft Single Malt', 30, 1100),
      ('Havana Club', 'Pernod Ricard', 'Rum', 'Dark Aged', 30, 510)
  ) as t(brand_name, parent_company, spirit_category, spirit_subcategory, volume_ml, billed_amount)
  offset (g % 10)
  limit 1
) b
on conflict do nothing;
