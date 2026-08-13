import type { GamePoolItem } from "@/lib/types";
import { getCatalogMeta } from "@/lib/games/data";

const SESSION_WINDOW_MS = 2 * 60 * 60 * 1000;

export interface SurprisePickContext {
  playedIds: string[];
  currentId?: string | null;
  groupSize?: number;
  sessionSpend?: number;
  sessionStartedAt?: string | null;
}

/**
 * Weighted random surprise picker with no-repeat memory.
 * Resets when the 2h session window elapses or the full pool is exhausted.
 */
export function pickSurpriseGame(
  pool: GamePoolItem[],
  ctx: SurprisePickContext
): GamePoolItem | null {
  const active = pool.filter((g) => g.is_active);
  if (!active.length) return null;

  const windowExpired =
    ctx.sessionStartedAt != null &&
    Date.now() - new Date(ctx.sessionStartedAt).getTime() > SESSION_WINDOW_MS;

  const played = windowExpired ? [] : ctx.playedIds;
  let candidates = active.filter(
    (g) => !played.includes(g.id) && g.id !== ctx.currentId
  );

  if (!candidates.length) {
    candidates = active.filter((g) => g.id !== ctx.currentId);
  }
  if (!candidates.length) candidates = active;

  const groupSize = ctx.groupSize ?? 2;
  const spend = ctx.sessionSpend ?? 0;

  const weighted = candidates.map((game) => {
    const meta = getCatalogMeta(game.id);
    const rules = game.rules_json ?? {};
    const weight = Number(meta?.weight ?? rules.weight ?? 1);
    const minGroup = Number(meta?.min_group_size ?? rules.min_group_size ?? 1);
    const minSpend = Number(meta?.min_spend ?? rules.min_spend ?? 0);

    let score = Math.max(0.1, weight);
    if (groupSize >= minGroup) score *= 1.15;
    else score *= 0.55;
    if (spend >= minSpend) score *= 1.1;
    if (spend >= 3000) score *= 1.05;
    return { game, score };
  });

  const total = weighted.reduce((sum, row) => sum + row.score, 0);
  let cursor = Math.random() * total;
  for (const row of weighted) {
    cursor -= row.score;
    if (cursor <= 0) return row.game;
  }
  return weighted[weighted.length - 1]?.game ?? null;
}

export function mergePlayedIds(
  local: string[],
  remote: string[] | null | undefined
): string[] {
  return Array.from(new Set([...(remote ?? []), ...local]));
}
