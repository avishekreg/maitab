import {
  GAMES_CATALOG,
  GAMES_CATALOG_COUNT,
  type HydratedCatalogGame,
} from "@/lib/games/100_games_catalog";
import type { GamePoolItem } from "@/lib/types";

/** Local fallback library mirroring the 100+ catalog. */
export const LOCAL_GAMES_POOL: GamePoolItem[] = GAMES_CATALOG.map((game) => ({
  id: game.id,
  title: game.title,
  game_type: game.game_type,
  is_active: game.is_active,
  rules_json: game.rules_json,
}));

export function getCatalogMeta(gameId: string): HydratedCatalogGame | undefined {
  return GAMES_CATALOG.find((g) => g.id === gameId);
}

export function extractUpsellLabel(game: GamePoolItem): string {
  return (
    (game.rules_json.upsell_label as string | undefined) ??
    "Pay Penalty / Order Round"
  );
}

export { GAMES_CATALOG, GAMES_CATALOG_COUNT };
