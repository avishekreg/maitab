import type { GameType } from "@/lib/types";
import { GAMES_CATALOG } from "@/lib/games/100_games_catalog";

export type GameRuleCategory =
  | "WHEELS"
  | "TABLE_DARES"
  | "REFLEX"
  | "MULTIPLAYER"
  | "VAULT";

export interface GameRule {
  id: string;
  name: string;
  category: GameRuleCategory;
  tagline: string;
  objective: string;
  howToPlay: string[];
  winCondition: string;
  lossCondition: string;
  drawOrTieRule: string;
  penaltiesAndRewards: { winner: string; loser: string };
  dos: string[];
  donts: string[];
}

const HOUSE_DOS = [
  "Keep dares fun and consensual — anyone can pass without shame.",
  "Respect venue staff, neighboring tables, and the dance floor.",
  "Sip, don't slam. Pace drinks with water between rounds.",
  "If someone looks unsteady, pause the game and offer a Saarthi ride.",
];

const HOUSE_DONTS = [
  "Never harass other guests or attempt hazardous stunts.",
  "Do not force anyone to drink, reveal, or perform.",
  "Do not target one person continuously.",
  "No glassware on the dance floor; no climbing speakers or booths.",
];

function rule(
  partial: Omit<GameRule, "dos" | "donts"> & {
    dos?: string[];
    donts?: string[];
  }
): GameRule {
  return {
    ...partial,
    dos: partial.dos ?? HOUSE_DOS,
    donts: partial.donts ?? HOUSE_DONTS,
  };
}

export const FORMAT_RULES: Record<string, GameRule> = {
  dare_wheel: rule({
    id: "dare_wheel",
    name: "Dare Wheel",
    category: "WHEELS",
    tagline: "Spin. Perform. Or the tab bites back.",
    objective:
      "Spin the inertia wheel and complete the designated social dare to avoid the tab penalty.",
    howToPlay: [
      "Players take turns spinning the metallic inertia wheel.",
      "Wait for the wheel to fully stop — no touching mid-spin.",
      "Execute the landed dare within a 60-second timer.",
      "Table votes Pass / Completed or Chicken Out / Failed.",
    ],
    winCondition:
      "Completing the dare unlocks bonus loyalty points or a free shooter coupon.",
    lossCondition:
      "Failing triggers the loser penalty: 1× Tequila Shot on the personal tab, or forfeit the next turn.",
    drawOrTieRule: "A 50/50 split vote triggers a 2× Penalty Re-spin.",
    penaltiesAndRewards: {
      winner: "Table Immunity + 50 arcade credits",
      loser: "Billed 1× Tequila Shot (₹280) or skip next spin",
    },
  }),
  most_likely_to: rule({
    id: "most_likely_to",
    name: "Most Likely To…",
    category: "TABLE_DARES",
    tagline: "The table decides who owns the prompt.",
    objective: "Vote on which table member best fits the prompt card.",
    howToPlay: [
      "A prompt is dealt to every phone at the table.",
      "Secret-vote within 15 seconds — It's them / Me or Pass.",
      "Tap Reveal to lock the tally and show the house result.",
      "Highest votes take the forfeit unless they hold Table Immunity.",
    ],
    winCondition: "Voting with the majority banks Table Sync Points.",
    lossCondition:
      "The player with the highest votes takes the round forfeit or drinks the penalty.",
    drawOrTieRule: "Tied highest players all take the forfeit simultaneously.",
    penaltiesAndRewards: {
      winner: "Table Sync Points + next-prompt immunity chip",
      loser: "Loser Pays — add the mapped shot or beer SKU to tab",
    },
    dos: [
      "Vote honestly; keep banter lighthearted.",
      "Rotate who gets roasted — share the spotlight.",
      ...HOUSE_DOS.slice(2),
    ],
    donts: [
      "Do not target one person continuously.",
      ...HOUSE_DONTS.filter((d) => !d.includes("target")),
    ],
  }),
  russian_roulette: rule({
    id: "russian_roulette",
    name: "Shot Roulette",
    category: "WHEELS",
    tagline: "Six chambers. One live pour. Don't blink.",
    objective:
      "Six-chamber tension builder — survive without landing on the loaded chamber.",
    howToPlay: [
      "One live penalty round is loaded across six slots (the rest are Safe).",
      "Players take turns pulling the trigger / spinning the cylinder.",
      "Landed label is law — Safe stays seated; Shot or Double Shot pays.",
      "Pass the wheel clockwise after each click.",
    ],
    winCondition: "Surviving a Safe chamber keeps you in the circle with no tab hit.",
    lossCondition:
      "Triggering the live chamber forces the mystery pour penalty onto your tab.",
    drawOrTieRule:
      "If five Safe rounds pass, the sixth player is the guaranteed drop.",
    penaltiesAndRewards: {
      winner: "Survive streak credits + skip-one-chamber chip",
      loser: "Mystery pour (Tequila / Double Shot) billed to personal tab",
    },
  }),
  reflex_speed_pour: rule({
    id: "reflex_speed_pour",
    name: "Reaction Pour Speed Test",
    category: "REFLEX",
    tagline: "Wait for neon green. Tap. Don't false-start.",
    objective: "Millisecond reaction duel — tap the instant the signal turns neon green.",
    howToPlay: [
      "Tap to arm the pad — it stays dark while the house randomizes delay.",
      "The pad flashes neon green. Tap immediately.",
      "Tapping early is a false start and an auto-loss.",
      "Best of the table's times wins the round.",
    ],
    winCondition: "Sub-250ms unlocks a free bar-snack coupon.",
    lossCondition: "A false start or the slowest tap takes the penalty pour.",
    drawOrTieRule: "Times within 5ms trigger a 1v1 Sudden Death re-arm.",
    penaltiesAndRewards: {
      winner: "Bar snack coupon + 25 arcade points",
      loser: "False-start round or slowest time billed as a shooter",
    },
  }),
  truth_or_shot: rule({
    id: "truth_or_shot",
    name: "Truth or Shot",
    category: "TABLE_DARES",
    tagline: "Spill the truth — or the shot hits the tab.",
    objective: "Answer the spicy truth or take the shot penalty within 45 seconds.",
    howToPlay: [
      "Spin or deal a truth prompt to the active player.",
      "They have 45 seconds to answer out loud to the table.",
      "Table can call Chicken Out if the answer is a dodge.",
      "Refusal or timeout auto-bills the mapped shot SKU.",
    ],
    winCondition: "A real answer awards the Truth Master Badge and 40 credits.",
    lossCondition: "Refusal, silence, or a called dodge bills the shot to the tab.",
    drawOrTieRule: "If the table splits on whether it was a real answer, re-deal a new prompt.",
    penaltiesAndRewards: {
      winner: "Truth Master Badge + 40 arcade credits",
      loser: "Mapped shot SKU added to personal tab",
    },
  }),
  who_pays_round: rule({
    id: "who_pays_round",
    name: "Who Pays the Round?",
    category: "MULTIPLAYER",
    tagline: "Plant a finger. Lightning picks the sponsor.",
    objective:
      "Up to 8 players place fingers on the screen; electric lightning randomly zaps one player to sponsor the round.",
    howToPlay: [
      "Everyone plants a finger (or tap-adds a stand-in on desktop).",
      "Need at least two fingers before the house will strike.",
      "Tap Strike lightning — one finger is chosen at random.",
      "Unzapped fingers ride free; the chosen finger pays.",
    ],
    winCondition: "Unzapped fingers drink the round on the sponsor's tab.",
    lossCondition: "The zapped finger sponsors the round (table Heineken round SKU).",
    drawOrTieRule: "If a finger lifts early, they auto-join the sponsor pool.",
    penaltiesAndRewards: {
      winner: "Round is on the house of the zapped player",
      loser: "Table Round (Heineken ×4) billed to the chosen finger",
    },
  }),
  lucky_wheel: rule({
    id: "lucky_wheel",
    name: "House Lucky Wheel",
    category: "WHEELS",
    tagline: "Inertia physics. Golden payoffs. No snappback.",
    objective: "Spin the house wheel and pocket the landed nightlife perk.",
    howToPlay: [
      "Tap Spin the house wheel and wait the full 4.5s inertia stop.",
      "Do not refresh mid-spin — the stop angle is already locked.",
      "Read the win modal. Spin Again lets you go again immediately.",
      "Other perks land in the arcade coupon wallet.",
    ],
    winCondition:
      "Landing a perk (shooter, 15% off, VIP Fast-Pass, DJ dedication, Saarthi ₹200) credits the wallet.",
    lossCondition: "There is no hard loss — Spin Again simply continues the night.",
    drawOrTieRule: "Identical perk on a re-spin stacks as a second coupon, not a void.",
    penaltiesAndRewards: {
      winner: "Coupon wallet credit matching the slice",
      loser: "None — only missed timing if you walk away mid-spin",
    },
  }),
  spin_the_bottle: rule({
    id: "spin_the_bottle",
    name: "Spin the Bottle",
    category: "WHEELS",
    tagline: "The bottle points. You play the action.",
    objective: "Spin to assign a bottle action to a player at the table.",
    howToPlay: [
      "Place phones face-up in a circle or use the on-screen bottle wheel.",
      "Spin once per round. The landed action is performed by the pointed player.",
      "Complete within 45 seconds or take the mapped penalty SKU.",
    ],
    winCondition: "Completing the action banks 20 credits and passes the bottle.",
    lossCondition: "Skipping bills the bottle-round penalty to that player.",
    drawOrTieRule: "If the bottle lands between two people, both complete a mini-action.",
    penaltiesAndRewards: {
      winner: "20 arcade credits",
      loser: "Mapped beer or shot SKU on tab",
    },
  }),
  never_have_i_ever: rule({
    id: "never_have_i_ever",
    name: "Never Have I Ever",
    category: "MULTIPLAYER",
    tagline: "Anonymous table poll. Honesty is the mechanic.",
    objective: "Vote I have / Never on the statement. The minority drinks.",
    howToPlay: [
      "Read the statement dealt to the table.",
      "Tap I have or Never — votes stream live to every phone.",
      "After voting, Next Statement deals a fresh prompt.",
      "House can lock the round and apply the minority forfeit.",
    ],
    winCondition: "Voting with the majority avoids the pour.",
    lossCondition: "The minority side takes the forfeit shooter.",
    drawOrTieRule: "A perfect split is a table toast — everyone sips, nobody is billed extra.",
    penaltiesAndRewards: {
      winner: "Majority immunity this statement",
      loser: "Minority pays the mapped shot SKU",
    },
  }),
  kings_cup: rule({
    id: "kings_cup",
    name: "King's Cup Digital Deck",
    category: "TABLE_DARES",
    tagline: "Flip a card. The rank is the house rule.",
    objective: "Flip the digital deck and execute the King's Cup rule for that rank.",
    howToPlay: [
      "Tap the deck to flip a card with 3D motion.",
      "Read the rank rule (Waterfall, King's Cup, Question Master, etc.).",
      "The table executes immediately; next player flips.",
      "King pours into the communal cup; the player who draws the last King drinks it.",
    ],
    winCondition: "Surviving a non-King card without breaking a live rule.",
    lossCondition: "Breaking the live rule or drawing the last King drinks the cup / penalty SKU.",
    drawOrTieRule: "Two players flipping on the same beat both honor the later card.",
    penaltiesAndRewards: {
      winner: "Rule-master chip until the next Queen/Jack",
      loser: "Communal cup or mapped cocktail SKU",
    },
  }),
  truth_or_tab: rule({
    id: "truth_or_tab",
    name: "Truth or Tab",
    category: "TABLE_DARES",
    tagline: "Spicy prompt. Countdown. Speak or the tab moves.",
    objective: "Answer the prompt before the timer hits zero, or the house bills the tab.",
    howToPlay: [
      "Deal a spicy prompt to the active player.",
      "The countdown starts (12–15s depending on the variant).",
      "Answer out loud before the bar empties.",
      "Timeout auto-completes as a tab hit.",
    ],
    winCondition: "Finishing a real answer before zero awards 30 credits.",
    lossCondition: "Timeout bills the mapped penalty SKU.",
    drawOrTieRule: "If two players are mid-prompt, the first to tap Deal goes; the other waits.",
    penaltiesAndRewards: {
      winner: "30 arcade credits",
      loser: "Mapped shot/cocktail SKU on tab",
    },
  }),
  neon_runner: rule({
    id: "neon_runner",
    name: "Neon Bar Runner",
    category: "REFLEX",
    tagline: "Tap-to-jump the bottle gauntlet.",
    objective: "Clear as many bottle obstacles as you can without clipping one.",
    howToPlay: [
      "Tap to jump the neon runner.",
      "Bottles slide from the right — time the hop.",
      "Clipping a bottle ends the run and locks the score.",
      "Tap again after a crash to retry.",
    ],
    winCondition: "Clearing 8+ bottles in a run unlocks a mixer coupon.",
    lossCondition: "A clip ends the run; under 3 bottles is a forfeit sip.",
    drawOrTieRule: "Equal high scores share the mixer coupon.",
    penaltiesAndRewards: {
      winner: "Mixer coupon + score credits",
      loser: "Forfeit sip if the run dies under 3 bottles",
    },
  }),
  cocktail_shaker: rule({
    id: "cocktail_shaker",
    name: "Cocktail Shaker Tap-Mash",
    category: "REFLEX",
    tagline: "Shake the phone or tap-mash to 40.",
    objective: "Hit 40 shakes (accelerometer) or tap-mashes to lock the pour.",
    howToPlay: [
      "Hold the phone and shake, or tap the pad rapidly.",
      "The meter fills to 40.",
      "Locking 40 fires confetti and an upsell prompt.",
    ],
    winCondition: "Reaching 40 locks the cocktail upsell as a reward, not a punishment.",
    lossCondition: "Abandoning under 40 forfeits the round with no coupon.",
    drawOrTieRule: "Two players hitting 40 in the same second both get the upsell option.",
    penaltiesAndRewards: {
      winner: "Cocktail upsell at happy-hour rate",
      loser: "No coupon if you bail early",
    },
  }),
  table_trivia: rule({
    id: "table_trivia",
    name: "Table Trivia Clash",
    category: "MULTIPLAYER",
    tagline: "Buzz the nightlife questions. Neighboring tables can clash.",
    objective: "Answer the three-question set; highest table score takes the round.",
    howToPlay: [
      "Read Q1–Q3 as they deal.",
      "Tap an option — first tap locks.",
      "Score is totaled at the end of the set.",
    ],
    winCondition: "2/3 or better wins a trivia coupon.",
    lossCondition: "0/3 bills a consolation shooter (optional, table can waive).",
    drawOrTieRule: "Equal scores share the coupon; no extra penalty.",
    penaltiesAndRewards: {
      winner: "Trivia coupon + clash points vs neighboring booths",
      loser: "Optional consolation shooter",
    },
  }),
  av_poll: rule({
    id: "av_poll",
    name: "AV Billboard DJ Poll",
    category: "MULTIPLAYER",
    tagline: "Vote the next drop. The wall listens.",
    objective: "Cast a vote for the live track drop or lighting theme.",
    howToPlay: [
      "Read the four AV options.",
      "Tap to cast — votes tally on every phone.",
      "The leading option is the table's billboard request.",
    ],
    winCondition: "Your pick leading the poll banks 10 credits.",
    lossCondition: "No tab penalty — this round is taste, not forfeit.",
    drawOrTieRule: "A tie lets AV run a 30-second blend of both themes.",
    penaltiesAndRewards: {
      winner: "10 credits + bragging rights on the wall",
      loser: "None",
    },
  }),
  scratch_win: rule({
    id: "scratch_win",
    name: "Scratch-and-Win Golden Card",
    category: "VAULT",
    tagline: "Scratch 45% of the foil to reveal the perk.",
    objective: "Scratch the golden card until the prize reveals.",
    howToPlay: [
      "Drag a finger across the foil.",
      "Clear about 45% to lock the reveal.",
      "Prize drops into the coupon wallet.",
    ],
    winCondition: "Reveal always yields a perk (shooter, VIP, Saarthi ₹200, or 15% off).",
    lossCondition: "Walking away mid-scratch voids that card.",
    drawOrTieRule: "One card per player per 10 minutes to keep the vault fair.",
    penaltiesAndRewards: {
      winner: "Revealed coupon in the arcade wallet",
      loser: "Voided card if abandoned",
    },
  }),
  mystery_vault: rule({
    id: "mystery_vault",
    name: "Mystery Vault Unboxing",
    category: "VAULT",
    tagline: "Tilt the lid. Crack the jackpot.",
    objective: "Open the 3D vault for a jackpot drop.",
    howToPlay: [
      "Tilt the box with pointer movement.",
      "Tap to crack the lid.",
      "Jackpot confetti fires; upsell is optional.",
    ],
    winCondition: "Opening the vault always drops a jackpot flavor (bottle-service upsell).",
    lossCondition: "No forced loss — decline the upsell with no penalty.",
    drawOrTieRule: "One vault open per table every 15 minutes.",
    penaltiesAndRewards: {
      winner: "Jackpot drop / bottle-service offer",
      loser: "None if declined",
    },
  }),
  sobriety_reflex: rule({
    id: "sobriety_reflex",
    name: "Saarthi Safe-Ride Reflex",
    category: "REFLEX",
    tagline: "Three cyan flashes. Earn a chauffeur perk.",
    objective:
      "Complete a three-round reaction timer. Fast averages unlock Saarthi ride perks.",
    howToPlay: [
      "Tap to arm. Wait for cyan — do not false-start.",
      "Complete three timed taps.",
      "Average under 320ms unlocks a chauffeur perk; slower still offers a Saarthi booking.",
    ],
    winCondition: "Average under 320ms unlocks a Saarthi ride perk.",
    lossCondition: "Slower averages do not punish — they still route you to book a chauffeur.",
    drawOrTieRule: "Equal averages share the perk.",
    penaltiesAndRewards: {
      winner: "mAISaarthi perk unlocked",
      loser: "No tab hit — book Saarthi anyway",
    },
    dos: [
      "If anyone at the table might drive, run this before last call.",
      "Treat a slow score as a cue to book Saarthi, not a dare to drive.",
      ...HOUSE_DOS.slice(0, 2),
    ],
    donts: [
      "Never use a 'good' reflex score as permission to drive after drinking.",
      ...HOUSE_DONTS,
    ],
  }),
  dice_duel: rule({
    id: "dice_duel",
    name: "Dice Duel",
    category: "MULTIPLAYER",
    tagline: "Two cubes. One target. Tab on the line.",
    objective: "Roll two dice and beat the house target number.",
    howToPlay: [
      "Tap Roll to throw both neon dice.",
      "Sum the faces — meet or beat the target to win immunity.",
      "Miss the target and the roller buys the mapped penalty.",
    ],
    winCondition: "Hitting the target banks arcade credits + table immunity.",
    lossCondition: "Under the target triggers the loser penalty SKU.",
    drawOrTieRule: "Exact target counts as a win.",
    penaltiesAndRewards: {
      winner: "Table Immunity + 40 arcade credits",
      loser: "Mapped shot SKU on personal tab",
    },
  }),
  hot_seat: rule({
    id: "hot_seat",
    name: "Hot Seat",
    category: "TABLE_DARES",
    tagline: "Timer on. Spotlight on. Answer or drink.",
    objective: "Survive the confession timer without bailing.",
    howToPlay: [
      "One player takes the hot seat.",
      "A prompt drops with a live countdown.",
      "Answer honestly before time runs out — or take the forfeit.",
    ],
    winCondition: "Finishing the answer before zero unlocks loyalty points.",
    lossCondition: "Bail / silence / timeout bills the penalty.",
    drawOrTieRule: "Pass is always allowed — next player inherits the seat.",
    penaltiesAndRewards: {
      winner: "Hot Seat Crown + 30 credits",
      loser: "Shot SKU or skip next dare",
    },
  }),
  memory_flash: rule({
    id: "memory_flash",
    name: "Memory Flash",
    category: "REFLEX",
    tagline: "Watch the pads. Replay the glow.",
    objective: "Repeat the neon pad sequence without a miss.",
    howToPlay: [
      "Watch the pads light in order.",
      "Tap the same sequence back.",
      "One miss ends the round.",
    ],
    winCondition: "Clearing the full sequence awards reflex credits.",
    lossCondition: "Wrong pad ends the streak — loser pays.",
    drawOrTieRule: "N/A — solo versus the house sequence.",
    penaltiesAndRewards: {
      winner: "Reflex badge + coupon chance",
      loser: "Mapped shooter on tab",
    },
  }),
  beat_tap: rule({
    id: "beat_tap",
    name: "Beat Tap",
    category: "REFLEX",
    tagline: "Lock the kick before last call.",
    objective: "Hit the bass pad the required number of times as fast as you can.",
    howToPlay: [
      "Tap the glowing pad to the imagined kick.",
      "Reach the required tap count.",
      "Faster clears earn bigger arcade credit bursts.",
    ],
    winCondition: "Completing the tap goal banks points.",
    lossCondition: "Walking away mid-run forfeits the turn.",
    drawOrTieRule: "N/A",
    penaltiesAndRewards: {
      winner: "Bassline coupon chance",
      loser: "Buy the next round",
    },
  }),
  two_truths: rule({
    id: "two_truths",
    name: "Two Truths One Lie",
    category: "TABLE_DARES",
    tagline: "Smell the fake. Call it out.",
    objective: "Identify which statement is the lie.",
    howToPlay: [
      "Read all three statements.",
      "Tap the one you think is fake.",
      "Correct calls toast the table; misses drink.",
    ],
    winCondition: "Catching the lie earns clash points.",
    lossCondition: "Wrong pick takes the forfeit.",
    drawOrTieRule: "If contested, re-deal a new pack.",
    penaltiesAndRewards: {
      winner: "Lie Detector chip",
      loser: "Penalty SKU",
    },
  }),
  red_light: rule({
    id: "red_light",
    name: "Red Light Freeze",
    category: "MULTIPLAYER",
    tagline: "Green moves. Red freezes. Don't flinch.",
    objective: "Hold the freeze cue when the pad turns red.",
    howToPlay: [
      "Start the round — green means move/hype.",
      "When red hits, freeze in the shown cue pose.",
      "Confirm the table held it to complete.",
    ],
    winCondition: "Clean freeze awards multiplayer sync points.",
    lossCondition: "Anyone who moves on red pays.",
    drawOrTieRule: "Disputed freezes re-run once.",
    penaltiesAndRewards: {
      winner: "Sync points",
      loser: "Shot for the flinchers",
    },
  }),
  charades: rule({
    id: "charades",
    name: "Midnight Charades",
    category: "TABLE_DARES",
    tagline: "Act the night. No talking.",
    objective: "Get the table to guess the nightlife prompt silently.",
    howToPlay: [
      "Reveal the prompt only to the actor.",
      "Act it out before the timer ends.",
      "Tap guessed when the table lands it.",
    ],
    winCondition: "A correct guess before timeout wins the round.",
    lossCondition: "Timeout bills the actor's penalty.",
    drawOrTieRule: "Partial guesses can award a re-prompt.",
    penaltiesAndRewards: {
      winner: "Stage credits",
      loser: "Mapped penalty",
    },
  }),
  high_low: rule({
    id: "high_low",
    name: "High-Low Streak",
    category: "MULTIPLAYER",
    tagline: "Call the next card. Ride the streak.",
    objective: "Guess whether the next card is higher or lower.",
    howToPlay: [
      "See the current card face.",
      "Tap Higher or Lower.",
      "Build a streak to the house goal without busting.",
    ],
    winCondition: "Hitting the streak goal awards jackpot credits.",
    lossCondition: "A bust ends the run — loser pays.",
    drawOrTieRule: "Equal cards count as a successful call.",
    penaltiesAndRewards: {
      winner: "Streak jackpot chance",
      loser: "Buy the round",
    },
  }),
};

const TYPE_TO_FORMAT: Record<GameType, string> = {
  ROULETTE: "russian_roulette",
  DARE_WHEEL: "dare_wheel",
  TRUTH_OR_SHOT: "truth_or_shot",
  NEVER_HAVE_I_EVER: "never_have_i_ever",
  SPIN_THE_BOTTLE: "spin_the_bottle",
  MOST_LIKELY_TO: "most_likely_to",
  LUCKY_WHEEL: "lucky_wheel",
  TRUTH_OR_TAB: "truth_or_tab",
  KINGS_CUP: "kings_cup",
  REACTION_POUR: "reflex_speed_pour",
  NEON_RUNNER: "neon_runner",
  COCKTAIL_SHAKER: "cocktail_shaker",
  WHO_PAYS: "who_pays_round",
  TABLE_TRIVIA: "table_trivia",
  AV_POLL: "av_poll",
  SCRATCH_WIN: "scratch_win",
  MYSTERY_VAULT: "mystery_vault",
  SOBRIETY_REFLEX: "sobriety_reflex",
  DICE_DUEL: "dice_duel",
  HOT_SEAT: "hot_seat",
  MEMORY_FLASH: "memory_flash",
  BEAT_TAP: "beat_tap",
  TWO_TRUTHS: "two_truths",
  RED_LIGHT: "red_light",
  CHARADES: "charades",
  HIGH_LOW: "high_low",
};

export const RULE_CATEGORIES: { id: GameRuleCategory | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "WHEELS", label: "Wheels" },
  { id: "TABLE_DARES", label: "Table Dares" },
  { id: "REFLEX", label: "Reflex Arcade" },
  { id: "MULTIPLAYER", label: "Multiplayer" },
  { id: "VAULT", label: "Vaults" },
];

export function formatRuleForType(type: GameType): GameRule {
  const key = TYPE_TO_FORMAT[type] ?? "dare_wheel";
  return FORMAT_RULES[key] ?? FORMAT_RULES.dare_wheel!;
}

export function ruleForGame(type: GameType, title?: string): GameRule {
  const base = formatRuleForType(type);
  if (!title || title === base.name) return base;
  return {
    ...base,
    id: `${base.id}:${title}`,
    name: title,
    tagline: `${base.tagline} · ${title}`,
  };
}

/** One rulebook card per catalog title (200+), inheriting format mechanics. */
export function catalogRulebook(): GameRule[] {
  return GAMES_CATALOG.map((game) => ruleForGame(game.game_type, game.title));
}
