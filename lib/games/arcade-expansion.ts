import type { GameType } from "@/lib/types";
import type { CatalogGameDefinition, GameCategory } from "@/lib/games/100_games_catalog";

export const LUCKY_WHEEL_SEGMENTS = [
  "Free Craft Shooter",
  "₹200 Saarthi Ride Voucher",
  "Table Dare",
  "DJ Song Request",
  "Spin Again",
  "Free Craft Shooter",
] as const;

export type HubFilter = "all" | "wheels" | "dares" | "reflex" | "clash";

export const HUB_TABS: { id: HubFilter; label: string }[] = [
  { id: "all", label: "All Games (200+)" },
  { id: "wheels", label: "Wheels & Vaults" },
  { id: "dares", label: "Table Dares" },
  { id: "reflex", label: "Reflex Arcade" },
  { id: "clash", label: "Multiplayer Clash" },
];

export function hubFilterFor(type: GameType): Exclude<HubFilter, "all"> {
  switch (type) {
    case "ROULETTE":
    case "DARE_WHEEL":
    case "SPIN_THE_BOTTLE":
    case "LUCKY_WHEEL":
    case "SCRATCH_WIN":
    case "MYSTERY_VAULT":
      return "wheels";
    case "TRUTH_OR_SHOT":
    case "TRUTH_OR_TAB":
    case "KINGS_CUP":
    case "HOT_SEAT":
    case "TWO_TRUTHS":
    case "CHARADES":
      return "dares";
    case "REACTION_POUR":
    case "NEON_RUNNER":
    case "COCKTAIL_SHAKER":
    case "SOBRIETY_REFLEX":
    case "MEMORY_FLASH":
    case "BEAT_TAP":
      return "reflex";
    default:
      return "clash";
  }
}

function g(
  id: string,
  title: string,
  game_type: GameType,
  category: GameCategory,
  extra: Record<string, unknown> = {}
): CatalogGameDefinition {
  return {
    id,
    title,
    game_type,
    weight: 1.35,
    min_group_size: 2,
    min_spend: 0,
    category,
    is_active: true,
    rules_json: {
      penalty_key: "tequila",
      upsell_label: "Claim Reward / Add Round",
      ...extra,
    },
  };
}

/** High-voltage expansion on top of the 100-game core catalog. */
export const ARCADE_EXPANSION: CatalogGameDefinition[] = [
  g("g-lucky-01", "House Lucky Wheel", "LUCKY_WHEEL", "LUCKY_WHEEL", {
    outcomes: [...LUCKY_WHEEL_SEGMENTS],
  }),
  g("g-lucky-02", "After-Hours Jackpot Wheel", "LUCKY_WHEEL", "LUCKY_WHEEL", {
    outcomes: [...LUCKY_WHEEL_SEGMENTS],
  }),
  g("g-tab-01", "Truth or Tab", "TRUTH_OR_TAB", "TABLE_DARES", {
    prompts: [
      "What's the wildest thing you've done in this club?",
      "Who at this table would you least want to share an Uber with?",
      "Confess the last drink you regretted ordering.",
      "Who here is most likely to get us a bottle we can't finish?",
    ],
    seconds: 15,
  }),
  g("g-tab-02", "Spicy Tab Confessions", "TRUTH_OR_TAB", "TABLE_DARES", {
    prompts: [
      "Who did you actually come here to see?",
      "What's your fake-it-till-you-make-it drink order?",
      "Name a song you'd never admit you like on the AV wall.",
    ],
    seconds: 12,
  }),
  g("g-kings-01", "King's Cup Digital Deck", "KINGS_CUP", "TABLE_DARES"),
  g("g-kings-02", "Midnight King's Cup", "KINGS_CUP", "TABLE_DARES"),
  g("g-react-01", "Reaction Pour Speed Test", "REACTION_POUR", "REFLEX_ARCADE"),
  g("g-run-01", "Neon Bar Runner", "NEON_RUNNER", "REFLEX_ARCADE"),
  g("g-shake-01", "Cocktail Shaker Tap-Mash", "COCKTAIL_SHAKER", "REFLEX_ARCADE"),
  g("g-pays-01", "Who Pays the Round?", "WHO_PAYS", "MULTIPLAYER_CLASH"),
  g("g-trivia-01", "Table Trivia Clash", "TABLE_TRIVIA", "MULTIPLAYER_CLASH", {
    questions: [
      {
        q: "Which spirit is the base of a classic Negroni?",
        options: ["Vodka", "Gin", "Rum", "Tequila"],
        a: 1,
      },
      {
        q: "A standard shot in India is typically how many ml?",
        options: ["20", "30", "45", "60"],
        a: 1,
      },
      {
        q: "What does a mAI Saarthi chauffeur drive you home in?",
        options: ["A cab", "Your own car", "A rickshaw", "A helicopter"],
        a: 1,
      },
    ],
  }),
  g("g-av-01", "AV Billboard DJ Poll", "AV_POLL", "MULTIPLAYER_CLASH", {
    options: ["Amapiano drop", "Bollywood remix", "Techno tunnel", "Gold strobes"],
  }),
  g("g-scratch-01", "Scratch-and-Win Golden Card", "SCRATCH_WIN", "MYSTERY_VAULT"),
  g("g-vault-01", "Mystery Vault Unboxing", "MYSTERY_VAULT", "MYSTERY_VAULT"),
  g("g-sober-01", "Saarthi Safe-Ride Reflex", "SOBRIETY_REFLEX", "SAARTHI_SAFE"),
];
