-- Align spirit_subtype trade labels for existing telemetry rows

alter table public.consumption_telemetry
  add column if not exists spirit_subtype text;

update public.consumption_telemetry
set spirit_subtype = coalesce(
  nullif(spirit_subtype, ''),
  case
    when coalesce(spirit_subcategory, '') in ('Single Malt Scotch', 'Indian Craft Single Malt') then 'Single Malt'
    when coalesce(spirit_subcategory, '') = 'Blanco' then 'Blanco Tequila'
    when coalesce(spirit_subcategory, '') in ('Botanical Craft', 'London Dry') then 'Botanical Gin'
    when coalesce(spirit_subcategory, '') in ('Draught/Craft Taps', 'Premium Imported Lager') then 'Draught Lager'
    when coalesce(spirit_subcategory, '') <> '' then spirit_subcategory
    when brand_name ilike '%walker%' then 'Blended Scotch'
    when brand_name ilike '%talisker%' or brand_name ilike '%amrut%' then 'Single Malt'
    when brand_name ilike '%maker%' then 'Bourbon'
    when brand_name ilike '%julio%' then 'Blanco Tequila'
    when brand_name ilike '%patr%' then 'Reposado'
    when brand_name ilike '%bombay%' or brand_name ilike '%tanqueray%' then 'Botanical Gin'
    when brand_name ilike '%kingfisher%' or brand_name ilike '%hoegaarden%' then 'Draught Lager'
    else 'Blended Scotch'
  end
)
where spirit_subtype is null or spirit_subtype = '';

alter table public.consumption_telemetry
  alter column spirit_subtype set default 'Blended Scotch';

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
