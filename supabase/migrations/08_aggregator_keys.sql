-- Optional aggregator integrations on clubs (venues in product language)
alter table public.clubs
  add column if not exists zomato_api_key text,
  add column if not exists swiggy_api_key text,
  add column if not exists aggregator_sync_active boolean not null default false,
  add column if not exists external_table_lockout_enabled boolean not null default false;

comment on column public.clubs.zomato_api_key is
  'AES-encrypted Zomato District webhook secret / merchant key';
comment on column public.clubs.swiggy_api_key is
  'AES-encrypted Swiggy SteppinOut partner API key';
comment on column public.clubs.aggregator_sync_active is
  'True only when at least one aggregator key is stored — enables background table-sync workers';
comment on column public.clubs.external_table_lockout_enabled is
  'Club admin toggle: automatic external table hold lockouts when sync is active';
