-- Digital token handshake audit trail (bartender ↔ waiter release)

create table if not exists public.order_handshakes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  token_code text not null,
  bartender_id uuid references auth.users (id),
  waiter_id uuid references auth.users (id),
  table_id uuid references public.club_tables (id),
  timestamp_ms bigint not null,
  device_fingerprint text not null,
  integrity_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_handshakes_order
  on public.order_handshakes (order_id);

create index if not exists idx_order_handshakes_club_time
  on public.order_handshakes (club_id, created_at desc);

alter table public.order_handshakes enable row level security;

drop policy if exists order_handshakes_staff_read on public.order_handshakes;
create policy order_handshakes_staff_read on public.order_handshakes
  for select
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'BARTENDER', 'CLUB_ADMIN', 'SUPER_ADMIN', 'GATE_STAFF'
    )
  );

drop policy if exists order_handshakes_staff_insert on public.order_handshakes;
create policy order_handshakes_staff_insert on public.order_handshakes
  for insert
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'BARTENDER', 'CLUB_ADMIN', 'SUPER_ADMIN'
    )
  );

-- Allow RELEASED on the order_status enum (handshake completion).
-- status is public.order_status — not a text check constraint.
alter type public.order_status add value if not exists 'RELEASED' before 'DELIVERED';
