import type { GameType, OrderItem } from "@/lib/types";
import { PENALTIES, type PenaltyKey } from "@/lib/games/penalties";
import rawCatalog from "@/lib/games/100_games_catalog.raw.json";

export type GameCategory =
  | "SHOT_ROULETTE"
  | "TRUTH_OR_SHOT"
  | "DARE_WHEEL"
  | "NHIE"
  | "SPIN_BOTTLE"
  | "MOST_LIKELY_TO";

export interface CatalogGameDefinition {
  id: string;
  title: string;
  game_type: GameType;
  weight: number;
  min_group_size: number;
  min_spend: number;
  category: GameCategory;
  is_active: boolean;
  rules_json: Record<string, unknown> & {
    penalty_key: PenaltyKey;
    upsell_label?: string;
  };
}

export interface HydratedCatalogGame {
  id: string;
  title: string;
  game_type: GameType;
  weight: number;
  min_group_size: number;
  min_spend: number;
  category: GameCategory;
  is_active: boolean;
  rules_json: Record<string, unknown> & {
    penalty_item: OrderItem;
    upsell_label: string;
  };
}

function hydrate(def: CatalogGameDefinition): HydratedCatalogGame {
  const key = def.rules_json.penalty_key;
  const penalty = PENALTIES[key] ?? PENALTIES.tequila;
  const { penalty_key: _omit, ...rest } = def.rules_json;
  return {
    id: def.id,
    title: def.title,
    game_type: def.game_type,
    weight: def.weight,
    min_group_size: def.min_group_size,
    min_spend: def.min_spend,
    category: def.category,
    is_active: def.is_active,
    rules_json: {
      ...rest,
      penalty_item: { ...penalty },
      upsell_label:
        (def.rules_json.upsell_label as string | undefined) ??
        "Pay Penalty / Order Round",
    },
  };
}

/** Full curated nightlife catalog — 105 interactive variants. */
export const GAMES_CATALOG: HydratedCatalogGame[] = (
  rawCatalog as CatalogGameDefinition[]
).map(hydrate);

export const GAMES_CATALOG_COUNT = GAMES_CATALOG.length;

export function catalogByType(type: GameType): HydratedCatalogGame[] {
  return GAMES_CATALOG.filter((g) => g.game_type === type && g.is_active);
}

export function catalogStats(): Record<string, number> {
  return GAMES_CATALOG.reduce<Record<string, number>>((acc, game) => {
    acc[game.game_type] = (acc[game.game_type] ?? 0) + 1;
    return acc;
  }, {});
}
