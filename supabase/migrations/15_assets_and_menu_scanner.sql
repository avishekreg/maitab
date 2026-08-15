-- Club QR table registry + AI menu scan drafts

create table if not exists public.venue_zones_tables (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  section_name text not null,
  table_identifier text not null,
  qr_payload_url text not null,
  created_at timestamptz default now()
);

create index if not exists idx_venue_zones_tables_venue
  on public.venue_zones_tables (venue_id);

create table if not exists public.menu_scan_drafts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  raw_image_url text not null,
  parsed_items jsonb not null default '[]'::jsonb,
  status text default 'DRAFT' check (status in ('DRAFT', 'APPROVED', 'REJECTED')),
  created_at timestamptz default now()
);

create index if not exists idx_menu_scan_drafts_venue
  on public.menu_scan_drafts (venue_id);

alter table public.venue_zones_tables enable row level security;
alter table public.menu_scan_drafts enable row level security;

drop policy if exists venue_zones_tables_staff on public.venue_zones_tables;
create policy venue_zones_tables_staff on public.venue_zones_tables
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
  );

drop policy if exists menu_scan_drafts_staff on public.menu_scan_drafts;
create policy menu_scan_drafts_staff on public.menu_scan_drafts
  for all using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'FLOOR_MANAGER', 'CAPTAIN'
    )
  );
