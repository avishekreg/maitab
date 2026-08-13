-- Phase 5: expand game types + session played-games memory

do $$ begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'game_type'
  ) then
    alter type public.game_type add value if not exists 'MOST_LIKELY_TO';
  end if;
exception
  when duplicate_object then null;
end $$;

-- Fast session-scoped memory (catalog_id or UUID as text; 2h window in app)
alter table public.active_sessions
  add column if not exists session_played_games text[] not null default '{}';

comment on column public.active_sessions.session_played_games is
  'Ordered game ids (catalog_id or uuid) played this session for non-repeat rotation.';

create or replace function public.mark_session_game_played(
  p_session_id uuid,
  p_game_id uuid,
  p_catalog_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := coalesce(nullif(p_catalog_id, ''), p_game_id::text);
begin
  insert into public.session_games_played (session_id, game_id)
  values (p_session_id, p_game_id)
  on conflict (session_id, game_id) do nothing;

  update public.active_sessions
  set session_played_games = case
    when v_token = any (session_played_games) then session_played_games
    else array_append(session_played_games, v_token)
  end
  where id = p_session_id;
end;
$$;
