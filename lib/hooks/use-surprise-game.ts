"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchGamesPool,
  fetchSessionPlayedGames,
  persistGameRound,
} from "@/lib/data/games";
import { extractUpsellLabel, LOCAL_GAMES_POOL } from "@/lib/games/data";
import { mergePlayedIds, pickSurpriseGame } from "@/lib/games/surprise";
import { useSessionStore } from "@/lib/store/session-store";
import type { GamePoolItem, OrderItem } from "@/lib/types";

function extractPenalty(game: GamePoolItem | null): OrderItem | null {
  if (!game) return null;
  const penalty = game.rules_json.penalty_item as OrderItem | undefined;
  if (!penalty?.name || !penalty.quantity || !penalty.unit_price) return null;
  return penalty;
}

export function useSurpriseGame(options?: { groupSize?: number }) {
  const session = useSessionStore((s) => s.session);
  const user = useSessionStore((s) => s.user);
  const playedGameIds = useSessionStore((s) => s.playedGameIds);
  const markGamePlayed = useSessionStore((s) => s.markGamePlayed);
  const hydratePlayedGames = useSessionStore((s) => s.hydratePlayedGames);
  const addOrderItems = useSessionStore((s) => s.addOrderItems);

  const [pool, setPool] = useState<GamePoolItem[]>(LOCAL_GAMES_POOL);
  const [game, setGame] = useState<GamePoolItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [flash, setFlash] = useState(false);

  const groupSize = options?.groupSize ?? 4;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchGamesPool(),
      fetchSessionPlayedGames(session.id),
    ]).then(([games, remotePlayed]) => {
      if (cancelled) return;
      setPool(games.length ? games : LOCAL_GAMES_POOL);
      const merged = mergePlayedIds(playedGameIds, remotePlayed);
      hydratePlayedGames(merged);
      setGame((current) =>
        current ??
          pickSurpriseGame(games.length ? games : LOCAL_GAMES_POOL, {
            playedIds: merged,
            groupSize,
            sessionSpend: session.total_session_spend,
            sessionStartedAt: session.started_at,
          })
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Intentionally once-per-session mount; spend updates affect next picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const penalty = useMemo(() => extractPenalty(game), [game]);
  const upsellLabel = useMemo(
    () => (game ? extractUpsellLabel(game) : "Pay Penalty / Order Round"),
    [game]
  );

  const remaining = useMemo(() => {
    const active = pool.filter((g) => g.is_active);
    return Math.max(0, active.length - playedGameIds.length);
  }, [pool, playedGameIds]);

  const surpriseMe = useCallback(() => {
    const next = pickSurpriseGame(pool, {
      playedIds: playedGameIds,
      currentId: game?.id,
      groupSize,
      sessionSpend: session.total_session_spend,
      sessionStartedAt: session.started_at,
    });
    setResult(null);
    setFlash(false);
    setSpinning(false);
    setGame(next);
  }, [
    pool,
    playedGameIds,
    game?.id,
    groupSize,
    session.total_session_spend,
    session.started_at,
  ]);

  const completeRound = useCallback(
    (outcome: string) => {
      if (!game) return;
      setSpinning(false);
      setResult(outcome);
      setFlash(true);
      markGamePlayed(game.id);
      void persistGameRound({
        sessionId: session.id,
        gameId: game.id,
        outcome,
        userId: user.id,
      });
      window.setTimeout(() => setFlash(false), 700);
    },
    [game, markGamePlayed, session.id, user.id]
  );

  const fulfillPenalty = useCallback(async () => {
    if (!penalty) return false;
    await addOrderItems([penalty]);
    return true;
  }, [penalty, addOrderItems]);

  return {
    pool,
    game,
    loading,
    result,
    setResult,
    spinning,
    setSpinning,
    flash,
    penalty,
    upsellLabel,
    remaining,
    playedCount: playedGameIds.length,
    catalogSize: pool.length,
    surpriseMe,
    completeRound,
    fulfillPenalty,
    playedGameIds,
  };
}
