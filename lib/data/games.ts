import type { GamePoolItem, GameType } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publishBus } from "@/lib/realtime/bus";
import { LOCAL_GAMES_POOL } from "@/lib/games/data";

export async function fetchGamesPool(): Promise<GamePoolItem[]> {
  if (!isSupabaseConfigured()) return LOCAL_GAMES_POOL;
  const supabase = getBrowserSupabase();
  if (!supabase) return LOCAL_GAMES_POOL;

  const { data, error } = await supabase
    .from("games_pool")
    .select("*")
    .eq("is_active", true);

  if (error || !data?.length) {
    if (error) console.error("fetchGamesPool", error.message);
    return LOCAL_GAMES_POOL;
  }

  return data.map((row) => {
    const rules = (row.rules_json as Record<string, unknown>) ?? {};
    const catalogId =
      typeof rules.catalog_id === "string" ? rules.catalog_id : String(row.id);
    return {
      id: catalogId,
      title: String(row.title),
      game_type: row.game_type as GameType,
      rules_json: rules,
      is_active: Boolean(row.is_active),
    };
  });
}

export async function fetchSessionPlayedGames(
  sessionId: string
): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getBrowserSupabase();
  if (!supabase) return [];

  const { data: sessionRow } = await supabase
    .from("active_sessions")
    .select("session_played_games")
    .eq("id", sessionId)
    .maybeSingle();

  return Array.from(
    new Set((sessionRow?.session_played_games as string[] | null) ?? [])
  );
}

export async function persistGameRound(input: {
  sessionId: string;
  gameId: string;
  outcome: string;
  userId?: string;
}): Promise<void> {
  publishBus("game_session_rounds", "INSERT", input);

  if (!isSupabaseConfigured()) return;
  const supabase = getBrowserSupabase();
  if (!supabase) return;

  // Resolve catalog id → live UUID when needed
  let liveGameId = input.gameId;
  if (!liveGameId.includes("-") || liveGameId.startsWith("g-")) {
    const { data: match } = await supabase
      .from("games_pool")
      .select("id, rules_json")
      .eq("is_active", true);

    const found = match?.find((row) => {
      const rules = row.rules_json as { catalog_id?: string } | null;
      return rules?.catalog_id === input.gameId || row.id === input.gameId;
    });
    if (found) liveGameId = String(found.id);
  }

  const [{ error: roundError }, { error: rpcError }] = await Promise.all([
    supabase.from("game_session_rounds").insert({
      session_id: input.sessionId,
      game_id: liveGameId,
      outcome: input.outcome,
      created_by: input.userId ?? null,
    }),
    supabase.rpc("mark_session_game_played", {
      p_session_id: input.sessionId,
      p_game_id: liveGameId,
      p_catalog_id: input.gameId.startsWith("g-") ? input.gameId : null,
    }),
  ]);

  if (roundError) console.error("persistGameRound", roundError.message);
  if (rpcError) {
    // Fallback if migration 04 not applied yet
    const { error: playedError } = await supabase
      .from("session_games_played")
      .upsert(
        { session_id: input.sessionId, game_id: liveGameId },
        { onConflict: "session_id,game_id" }
      );
    if (playedError) console.error("session_games_played", playedError.message);
  }
}

export async function castGameVote(input: {
  sessionId: string;
  gameId: string;
  userId: string;
  vote: "YES" | "NO";
}): Promise<{ yes: number; no: number }> {
  publishBus("game_session_votes", "UPSERT", input);

  if (!isSupabaseConfigured()) {
    return { yes: input.vote === "YES" ? 1 : 0, no: input.vote === "NO" ? 1 : 0 };
  }

  const supabase = getBrowserSupabase();
  if (!supabase) {
    return { yes: 0, no: 0 };
  }

  const { error } = await supabase.from("game_session_votes").upsert(
    {
      session_id: input.sessionId,
      game_id: input.gameId,
      user_id: input.userId,
      vote: input.vote,
    },
    { onConflict: "session_id,game_id,user_id" }
  );

  if (error) console.error("castGameVote", error.message);

  const { data } = await supabase.rpc("game_vote_tally", {
    p_session_id: input.sessionId,
    p_game_id: input.gameId,
  });

  const row = Array.isArray(data) ? data[0] : data;
  return {
    yes: Number(row?.yes_count ?? 0),
    no: Number(row?.no_count ?? 0),
  };
}
