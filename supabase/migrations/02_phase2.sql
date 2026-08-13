-- Phase 2: JWT claim helpers, game vote sync, lucky-draw broadcast extras
-- Prerequisite: 01_schema.sql must have completed successfully in this project.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    raise exception
      'Phase 2 blocked: public.user_role is missing. Re-run the FULL updated 01_schema.sql and confirm Success before Phase 2.';
  end if;

  if to_regclass('public.users') is null then
    raise exception
      'Phase 2 blocked: public.users is missing. Migration 01 did not apply — fix 01 first.';
  end if;
end $$;

-- Prefer JWT app_metadata.role when present, else public.users.role
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::public.user_role,
    (select u.role from public.users u where u.id = auth.uid())
  );
$$;

create or replace function public.current_user_club_id()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'club_id', '')::uuid,
    (select u.club_id from public.users u where u.id = auth.uid())
  );
$$;

-- Multiplayer Never Have I Ever / table game votes
create table if not exists public.game_session_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.active_sessions (id) on delete cascade,
  game_id uuid not null references public.games_pool (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  vote text not null check (vote in ('YES', 'NO')),
  created_at timestamptz not null default now(),
  unique (session_id, game_id, user_id)
);

alter table public.game_session_votes enable row level security;

create policy game_votes_select on public.game_session_votes
for select using (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_staff_of_club(s.club_id))
  )
);

create policy game_votes_upsert on public.game_session_votes
for all using (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id and s.user_id = auth.uid() and s.status = 'ACTIVE'
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.active_sessions s
    where s.id = session_id and s.user_id = auth.uid() and s.status = 'ACTIVE'
  )
);

-- Persist last game outcome for session sync
create table if not exists public.game_session_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.active_sessions (id) on delete cascade,
  game_id uuid not null references public.games_pool (id),
  outcome text not null,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

alter table public.game_session_rounds enable row level security;

create policy game_rounds_select on public.game_session_rounds
for select using (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_staff_of_club(s.club_id))
  )
);

create policy game_rounds_insert on public.game_session_rounds
for insert with check (
  exists (
    select 1 from public.active_sessions s
    where s.id = session_id and s.user_id = auth.uid() and s.status = 'ACTIVE'
  )
);

-- Realtime for Phase 2 channels
alter publication supabase_realtime add table public.game_session_votes;
alter publication supabase_realtime add table public.game_session_rounds;

-- Vote tally helper
create or replace function public.game_vote_tally(p_session_id uuid, p_game_id uuid)
returns table (yes_count bigint, no_count bigint)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    count(*) filter (where vote = 'YES') as yes_count,
    count(*) filter (where vote = 'NO') as no_count
  from public.game_session_votes
  where session_id = p_session_id
    and game_id = p_game_id;
$$;

-- Hardened flash promo with explicit radius defaults
create or replace function public.can_create_flash_promo(
  p_club_id uuid,
  p_category text,
  p_radius_m integer default 1500,
  p_lockout_min integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_loc extensions.geography;
  v_conflict boolean;
begin
  select location into v_loc from public.clubs where id = p_club_id;
  if v_loc is null then
    return false;
  end if;

  select exists (
    select 1
    from public.clubs c
    left join public.promo_lockouts pl
      on pl.club_id = c.id
     and pl.category = p_category
     and pl.locked_until > now()
    where c.id <> p_club_id
      and (
        c.active_promo_category = p_category
        or pl.id is not null
      )
      and st_dwithin(c.location, v_loc, p_radius_m)
  ) into v_conflict;

  if v_conflict then
    insert into public.fraud_logs (club_id, event_type, details)
    values (
      p_club_id,
      'PROMO_CANNIBALIZATION_BLOCKED',
      jsonb_build_object(
        'category', p_category,
        'radius_m', p_radius_m,
        'lockout_min', p_lockout_min
      )
    );
    return false;
  end if;

  insert into public.promo_lockouts (club_id, category, locked_until)
  values (p_club_id, upper(p_category), now() + make_interval(mins => p_lockout_min));

  update public.clubs
  set active_promo_category = upper(p_category)
  where id = p_club_id;

  return true;
end;
$$;
