-- MaiSaarthi on-demand chauffeur dispatch: verified drivers + trip ledger

create table if not exists public.saarthi_drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text,
  dl_number text not null,
  dl_expiry date not null,
  pcc_certificate_url text,
  police_verification_status text not null default 'VERIFIED'
    check (police_verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  transmission_specialties text[] not null default array['AUTOMATIC', 'MANUAL', 'LUXURY_EV']::text[],
  is_online boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  rating numeric(3,2) not null default 4.95,
  total_trips_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saarthi_trips (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid,
  guest_name text not null,
  guest_phone text not null,
  venue_id uuid not null,
  car_brand text not null,
  car_model text not null,
  transmission_type text not null
    check (transmission_type in ('AUTOMATIC', 'MANUAL', 'LUXURY_EV')),
  pickup_venue_name text not null,
  drop_address text not null,
  base_fare numeric not null default 899,
  surge_fare numeric not null default 0,
  total_fare numeric not null default 899,
  trip_otp text not null,
  assigned_driver_id uuid references public.saarthi_drivers(id),
  trip_status text not null default 'REQUESTED'
    check (trip_status in (
      'REQUESTED', 'ACCEPTED', 'ARRIVED_AT_VALET', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
  pre_trip_inspection_photos text[],
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_saarthi_trips_status on public.saarthi_trips(trip_status);
create index if not exists idx_saarthi_trips_venue on public.saarthi_trips(venue_id);
create index if not exists idx_saarthi_trips_driver on public.saarthi_trips(assigned_driver_id);
create index if not exists idx_saarthi_drivers_online on public.saarthi_drivers(is_online);

alter table public.saarthi_drivers enable row level security;
alter table public.saarthi_trips enable row level security;

drop policy if exists saarthi_drivers_read on public.saarthi_drivers;
create policy saarthi_drivers_read on public.saarthi_drivers
  for select using (true);

drop policy if exists saarthi_drivers_write on public.saarthi_drivers;
create policy saarthi_drivers_write on public.saarthi_drivers
  for all using (
    public.current_user_role()::text in ('SUPER_ADMIN', 'CLUB_ADMIN', 'SAARTHI_DRIVER')
  )
  with check (
    public.current_user_role()::text in ('SUPER_ADMIN', 'CLUB_ADMIN', 'SAARTHI_DRIVER')
  );

drop policy if exists saarthi_trips_read on public.saarthi_trips;
create policy saarthi_trips_read on public.saarthi_trips
  for select using (true);

drop policy if exists saarthi_trips_insert on public.saarthi_trips;
create policy saarthi_trips_insert on public.saarthi_trips
  for insert with check (true);

drop policy if exists saarthi_trips_update on public.saarthi_trips;
create policy saarthi_trips_update on public.saarthi_trips
  for update using (
    public.current_user_role()::text in (
      'SUPER_ADMIN', 'CLUB_ADMIN', 'SAARTHI_DRIVER', 'CUSTOMER'
    )
  );

insert into public.saarthi_drivers (
  id, full_name, phone, email, dl_number, dl_expiry,
  pcc_certificate_url, police_verification_status, transmission_specialties,
  is_online, current_lat, current_lng, rating, total_trips_completed
) values
  (
    'aa111111-1111-1111-1111-111111111111',
    'Arjun Khanna',
    '+919811100001',
    'arjun.saarthi@maitab.demo',
    'MH14 20220391221',
    '2028-11-30',
    '/compliance/pcc-arjun.pdf',
    'VERIFIED',
    array['AUTOMATIC', 'LUXURY_EV']::text[],
    true, 19.0765, 72.8778, 4.98, 412
  ),
  (
    'aa111111-1111-1111-1111-111111111112',
    'Meera Solanki',
    '+919811100002',
    'meera.saarthi@maitab.demo',
    'MH01 20190445512',
    '2027-06-18',
    '/compliance/pcc-meera.pdf',
    'VERIFIED',
    array['MANUAL', 'AUTOMATIC']::text[],
    true, 19.0748, 72.8791, 4.96, 288
  ),
  (
    'aa111111-1111-1111-1111-111111111113',
    'Vikram Dsouza',
    '+919811100003',
    'vikram.saarthi@maitab.demo',
    'GA07 20210118844',
    '2029-01-12',
    '/compliance/pcc-vikram.pdf',
    'VERIFIED',
    array['LUXURY_EV', 'AUTOMATIC', 'MANUAL']::text[],
    true, 19.0781, 72.8762, 4.99, 640
  )
on conflict (id) do nothing;
