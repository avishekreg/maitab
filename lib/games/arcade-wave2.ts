import type { GameType } from "@/lib/types";
import type { CatalogGameDefinition, GameCategory } from "@/lib/games/100_games_catalog";

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
    weight: 1.25,
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

const LUCKY_PRIZES = [
  "Free Craft Shooter",
  "₹200 Saarthi Ride Voucher",
  "Table Dare",
  "DJ Song Request",
  "Spin Again",
  "Bottle Sparkler Moment",
  "Table Immunity Chip",
] as const;

const TAB_PROMPTS = [
  "What's the wildest thing you've done in this club?",
  "Who at this table would you least want to share an Uber with?",
  "Confess the last drink you regretted ordering.",
  "Who here is most likely to get us a bottle we can't finish?",
  "Name a crush you won't text after last call.",
  "What's your fake-it-till-you-make-it drink order?",
  "Who did you actually come here to see?",
  "What's the pettiest reason you've left a club early?",
  "Admit a song you'd never request on the AV wall.",
  "Who here has the greediest tab energy?",
];

const TRIVIA_PACKS: { q: string; options: string[]; a: number }[][] = [
  [
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
      q: "What does a mAISaarthi chauffeur drive you home in?",
      options: ["A cab", "Your own car", "A rickshaw", "A helicopter"],
      a: 1,
    },
  ],
  [
    {
      q: "Espresso Martini traditionally uses which coffee?",
      options: ["Cold brew", "Fresh espresso", "Instant", "Turkish"],
      a: 1,
    },
    {
      q: "Which city invented the Old Fashioned?",
      options: ["London", "Louisville", "Havana", "Goa"],
      a: 1,
    },
    {
      q: "Amapiano originated primarily in which country?",
      options: ["Nigeria", "South Africa", "Brazil", "UK"],
      a: 1,
    },
  ],
  [
    {
      q: "Which cocktail is gin + Campari + sweet vermouth?",
      options: ["Manhattan", "Negroni", "Boulevardier", "Aviation"],
      a: 1,
    },
    {
      q: "What does 'ABV' measure?",
      options: ["Bitterness", "Alcohol by volume", "Acidity", "Age"],
      a: 1,
    },
    {
      q: "VIP Fast-Pass in mAITab primarily skips which queue?",
      options: ["Food", "Door / entry", "Uber", "Coat check"],
      a: 1,
    },
  ],
];

const TWO_TRUTHS_SETS = [
  {
    statements: [
      "I once closed a bar tab with someone else's card by mistake.",
      "I've never been on a dance floor after 2am.",
      "I know the bartender's real name.",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I've ordered bottle service alone.",
      "I still use the same password as my email.",
      "I've never ghosted a group chat for a better table.",
    ],
    lieIndex: 2,
  },
  {
    statements: [
      "I have a dedicated nightlife playlist named after a crush.",
      "I've never sung along to a Bollywood remix in public.",
      "I tip better after the third drink.",
    ],
    lieIndex: 1,
  },
];

const CHARADE_PROMPTS = [
  "Drunk flamingo on the VIP rope",
  "Bartender shaking a neon martini",
  "Someone losing their phone on the dance floor",
  "Saarthi driver waiting patiently outside",
  "Table arguing over who pays",
  "DJ dropping an unexpected Amapiano reset",
  "Gate staff scanning a Gold Pass",
  "Friend hyping a weak karaoke attempt",
];

const HOT_SEAT_PROMPTS = [
  "Who at the table is most likely to start drama before midnight?",
  "Confess your most expensive impulse order tonight.",
  "Rank everyone here by chaos energy — out loud.",
  "What's one secret you'd only tell after two shots?",
];

const RED_LIGHT_CUES = [
  "Freeze mid-sip",
  "Strike a VIP pose",
  "Point at the loudest dancer",
  "Hold eye contact with your left neighbour",
  "Mime ordering a bottle",
];

/** Wave 2 — denser catalog + brand-new playable formats. */
export const ARCADE_WAVE2: CatalogGameDefinition[] = [
  // —— Existing formats, many more titles ——
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-lucky-w2-${i + 1}`, `Neon Jackpot Wheel #${i + 1}`, "LUCKY_WHEEL", "LUCKY_WHEEL", {
      outcomes: [...LUCKY_PRIZES],
    })
  ),
  ...Array.from({ length: 10 }, (_, i) =>
    g(`g-tab-w2-${i + 1}`, `Truth or Tab Afterdark #${i + 1}`, "TRUTH_OR_TAB", "TABLE_DARES", {
      prompts: TAB_PROMPTS.slice(i % 6).concat(TAB_PROMPTS.slice(0, (i % 6) + 1)),
      seconds: 12 + (i % 4) * 2,
    })
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    g(`g-kings-w2-${i + 1}`, `King's Cup Midnight Deck #${i + 1}`, "KINGS_CUP", "TABLE_DARES")
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    g(`g-react-w2-${i + 1}`, `Reaction Pour Lightning #${i + 1}`, "REACTION_POUR", "REFLEX_ARCADE")
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    g(`g-run-w2-${i + 1}`, `Neon Bar Runner Rush #${i + 1}`, "NEON_RUNNER", "REFLEX_ARCADE")
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    g(`g-shake-w2-${i + 1}`, `Cocktail Shaker Frenzy #${i + 1}`, "COCKTAIL_SHAKER", "REFLEX_ARCADE")
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    g(`g-pays-w2-${i + 1}`, `Who Pays Blitz #${i + 1}`, "WHO_PAYS", "MULTIPLAYER_CLASH")
  ),
  ...TRIVIA_PACKS.flatMap((pack, i) => [
    g(`g-trivia-w2-${i + 1}a`, `Table Trivia Clash · Set ${i + 1}A`, "TABLE_TRIVIA", "MULTIPLAYER_CLASH", {
      questions: pack,
    }),
    g(`g-trivia-w2-${i + 1}b`, `Table Trivia Clash · Set ${i + 1}B`, "TABLE_TRIVIA", "MULTIPLAYER_CLASH", {
      questions: pack,
    }),
  ]),
  ...Array.from({ length: 6 }, (_, i) =>
    g(`g-av-w2-${i + 1}`, `AV Billboard Crowd Poll #${i + 1}`, "AV_POLL", "MULTIPLAYER_CLASH", {
      options: [
        "Amapiano drop",
        "Bollywood remix",
        "Techno tunnel",
        "Gold strobes",
        "Afrobeats heat",
        "Desi trap reset",
      ].slice(0, 4 + (i % 3)),
    })
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    g(`g-scratch-w2-${i + 1}`, `Scratch-and-Win Foil #${i + 1}`, "SCRATCH_WIN", "MYSTERY_VAULT")
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    g(`g-vault-w2-${i + 1}`, `Mystery Vault Crack #${i + 1}`, "MYSTERY_VAULT", "MYSTERY_VAULT")
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    g(`g-sober-w2-${i + 1}`, `Saarthi Safe Reflex Drill #${i + 1}`, "SOBRIETY_REFLEX", "SAARTHI_SAFE")
  ),

  // —— Brand-new formats ——
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-dice-w2-${i + 1}`, `Dice Duel High-Roller #${i + 1}`, "DICE_DUEL", "MULTIPLAYER_CLASH", {
      target: 7 + (i % 5),
    })
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-hot-w2-${i + 1}`, `Hot Seat Confessions #${i + 1}`, "HOT_SEAT", "TABLE_DARES", {
      prompts: HOT_SEAT_PROMPTS,
      seconds: 20,
    })
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-mem-w2-${i + 1}`, `Memory Flash Neon #${i + 1}`, "MEMORY_FLASH", "REFLEX_ARCADE", {
      levels: 3 + (i % 3),
    })
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-beat-w2-${i + 1}`, `Beat Tap Bassline #${i + 1}`, "BEAT_TAP", "REFLEX_ARCADE", {
      taps: 8 + (i % 5),
    })
  ),
  ...TWO_TRUTHS_SETS.flatMap((set, i) => [
    g(`g-tt-${i + 1}a`, `Two Truths One Lie · Pack ${i + 1}A`, "TWO_TRUTHS", "TABLE_DARES", set),
    g(`g-tt-${i + 1}b`, `Two Truths One Lie · Pack ${i + 1}B`, "TWO_TRUTHS", "TABLE_DARES", set),
  ]),
  ...Array.from({ length: 6 }, (_, i) =>
    g(`g-red-w2-${i + 1}`, `Red Light Freeze Frame #${i + 1}`, "RED_LIGHT", "MULTIPLAYER_CLASH", {
      cues: RED_LIGHT_CUES,
    })
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-char-w2-${i + 1}`, `Midnight Charades #${i + 1}`, "CHARADES", "TABLE_DARES", {
      prompts: CHARADE_PROMPTS,
      seconds: 45,
    })
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    g(`g-hl-w2-${i + 1}`, `High-Low Card Streak #${i + 1}`, "HIGH_LOW", "MULTIPLAYER_CLASH", {
      rounds: 5,
    })
  ),
];
