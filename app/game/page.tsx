"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Search, Sparkles, Trophy, Wine } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  AvPollEngine,
  BeatTapEngine,
  CharadesEngine,
  CocktailShakerEngine,
  DiceDuelEngine,
  HighLowEngine,
  HotSeatEngine,
  KingsCupEngine,
  MemoryFlashEngine,
  MysteryVaultEngine,
  NeonBarRunner,
  ReactionPourEngine,
  RedLightEngine,
  ScratchWinEngine,
  SobrietyReflexEngine,
  TableTriviaEngine,
  TruthOrTabEngine,
  TwoTruthsEngine,
  WhoPaysEngine,
} from "@/components/games/arcade-engines";
import { GameFlipCard, PromptRevealCard } from "@/components/games/GameFlipCard";
import { LuckyWheel } from "@/components/games/lucky-wheel";
import { GameRulesModal, HowToPlayTrigger } from "@/components/games/GameRulesModal";
import { TablePartyEngine } from "@/components/games/TablePartyEngine";
import { NhieVotePanel } from "@/components/games/NhieVotePanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { HUB_TABS, hubFilterFor, type HubFilter } from "@/lib/games/arcade-expansion";
import {
  creditArcadeReward,
  readArcadeWallet,
  type ArcadeWallet,
} from "@/lib/games/arcade-wallet";
import { catalogStats } from "@/lib/games/100_games_catalog";
import { ruleForGame } from "@/lib/games/rules-registry";
import { castGameVote } from "@/lib/data/games";
import { useGameVotesRealtime } from "@/lib/hooks/use-game-votes-realtime";
import { useSurpriseGame } from "@/lib/hooks/use-surprise-game";
import { publishBus } from "@/lib/realtime/bus";
import { useSessionStore } from "@/lib/store/session-store";
import { cn, triggerHaptic } from "@/lib/utils";

const CHARADE_FALLBACK = [
  "Drunk flamingo on the VIP rope",
  "Bartender shaking a neon martini",
  "Someone losing their phone on the dance floor",
];

const SHELL =
  "arcade-glow-card group relative select-none overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/90 p-5 text-left shadow-[0_0_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-lux ease-lux hover:-translate-y-0.5 hover:border-violet-500/45 hover:shadow-[0_0_30px_rgba(124,58,237,0.22)] active:scale-[0.98] cursor-pointer";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

const SELF_PLAY = new Set([
  "TRUTH_OR_TAB",
  "KINGS_CUP",
  "REACTION_POUR",
  "NEON_RUNNER",
  "COCKTAIL_SHAKER",
  "WHO_PAYS",
  "TABLE_TRIVIA",
  "AV_POLL",
  "SCRATCH_WIN",
  "MYSTERY_VAULT",
  "SOBRIETY_REFLEX",
  "NEVER_HAVE_I_EVER",
  "MOST_LIKELY_TO",
  "DICE_DUEL",
  "HOT_SEAT",
  "MEMORY_FLASH",
  "BEAT_TAP",
  "TWO_TRUTHS",
  "RED_LIGHT",
  "CHARADES",
  "HIGH_LOW",
]);

export default function GamePage() {
  const session = useSessionStore((s) => s.session);
  const user = useSessionStore((s) => s.user);
  const [voteBurst, setVoteBurst] = useState(false);
  const [orderedNote, setOrderedNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<HubFilter>("all");
  const [query, setQuery] = useState("");
  const [wallet, setWallet] = useState<ArcadeWallet>({ points: 120, coupons: [] });
  const [rulesOpen, setRulesOpen] = useState(false);

  const {
    pool,
    game,
    loading,
    result,
    spinning,
    setSpinning,
    flash,
    penalty,
    upsellLabel,
    remaining,
    playedCount,
    catalogSize,
    surpriseMe,
    playGame,
    completeRound,
    fulfillPenalty,
    playedGameIds,
  } = useSurpriseGame({ groupSize: 4 });

  const { yes, no } = useGameVotesRealtime(session.id, game?.id ?? null);
  const stats = useMemo(() => catalogStats(), []);

  useEffect(() => {
    setWallet(readArcadeWallet());
  }, []);

  const rouletteOutcomes = (game?.rules_json.outcomes as string[]) ?? [
    "Safe",
    "Shot",
  ];
  const truthPrompts = (game?.rules_json.prompts as string[]) ?? [];
  const dares = (game?.rules_json.dares as string[]) ?? [];
  const nhieStatements = (game?.rules_json.statements as string[]) ?? [
    "Never have I ever...",
  ];
  const bottleActions = (game?.rules_json.actions as string[]) ?? ["Spin"];
  const mostLikelyPrompt =
    ((game?.rules_json.prompts as string[]) ?? [])[0] ??
    "Most likely to buy the next round";
  const trivia = (game?.rules_json.questions as {
    q: string;
    options: string[];
    a: number;
  }[]) ?? [];
  const avOptions = (game?.rules_json.options as string[]) ?? [
    "Amapiano drop",
    "Techno tunnel",
  ];

  const filteredPool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((item) => {
      const hub = hubFilterFor(item.game_type);
      if (filter !== "all" && hub !== filter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.game_type.toLowerCase().includes(q)
      );
    });
  }, [filter, pool, query]);

  function onSurprise() {
    surpriseMe();
    void triggerHaptic(25);
    setOrderedNote(null);
  }

  function startSpin() {
    if (!game || spinning) return;
    setSpinning(true);
  }

  function onEngineComplete(outcome: string) {
    completeRound(outcome);
    setWallet(creditArcadeReward(outcome));
  }

  async function vote(choice: "YES" | "NO") {
    if (!game) return;
    setVoteBurst(true);
    window.setTimeout(() => setVoteBurst(false), 700);
    const tally = await castGameVote({
      sessionId: session.id,
      gameId: game.id,
      userId: user.id,
      vote: choice,
    });
    publishBus("game_session_votes", "UPSERT", {
      sessionId: session.id,
      gameId: game.id,
      vote: choice,
      yes: tally.yes,
      no: tally.no,
    });
    void triggerHaptic(30);
  }

  async function onPayPenalty() {
    const ok = await fulfillPenalty();
    if (!ok || !penalty) return;
    void triggerHaptic([40, 40, 80]);
    setOrderedNote(
      `Added ${penalty.quantity}× ${penalty.name} to your mAITab`
    );
  }

  const selfPlay = game ? SELF_PLAY.has(game.game_type) : false;

  return (
    <AppShell title="Arcade">
      <div className="arcade-stage theme-dark-capsule relative w-full max-w-full overflow-x-hidden rounded-[2rem] border border-zinc-800/90 bg-[#07080c] px-4 py-6 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_10%_-10%,rgba(124,58,237,0.22),transparent_55%),radial-gradient(700px_360px_at_90%_0%,rgba(6,182,212,0.14),transparent_50%)]" />

        <div className="relative min-w-0 w-full max-w-full">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                High-voltage nightlife arcade
              </p>
              <h1 className="mt-1 select-none font-display text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                {catalogSize}+ table games
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-400 md:text-sm">
                8 new engines · wheels, dares, reflex, clash — denser than ever.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HowToPlayTrigger
                label="Table rules"
                disabled={!game}
                onClick={() => {
                  if (!game) return;
                  setRulesOpen(true);
                  void triggerHaptic(12);
                }}
              />
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-zinc-900/90 px-4 py-2 font-mono text-xs font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                <span>{wallet.points} pts</span>
                <span className="text-amber-500/50">·</span>
                <span>{wallet.coupons.length} coupons</span>
              </div>
            </div>
          </div>

          <div className="no-scrollbar mt-5 flex w-full min-w-0 items-center gap-2 overflow-x-auto px-1 py-2">
            {HUB_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className={
                    active
                      ? "shrink-0 scale-[1.02] rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-transform"
                      : "shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-100 active:scale-95"
                  }
                >
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          <div className="group relative mx-auto my-4 w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-3.5 z-[1] h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-violet-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU dares, wheels, reflex, trivia…"
              className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-900/90 py-3 pl-11 pr-4 text-sm text-white shadow-inner backdrop-blur-xl transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto px-1 py-2">
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400 transition-all hover:border-zinc-600 hover:text-white"
            >
              {remaining} unplayed
            </button>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400 transition-all hover:border-zinc-600 hover:text-white"
            >
              {playedCount} played
            </button>
            {Object.entries(stats)
              .slice(0, 6)
              .map(([type, count]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setQuery(type.replaceAll("_", " ").toLowerCase())
                  }
                  className="shrink-0 cursor-pointer rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400 transition-all hover:border-zinc-600 hover:text-white"
                >
                  {type.replaceAll("_", " ")} · {count}
                </button>
              ))}
          </div>

          <div className="mt-6">
            <GameFlipCard flipKey={game?.id ?? "empty"}>
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/90 p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:p-8">
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 opacity-80" />
                <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-90 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.22),0_0_36px_rgba(124,58,237,0.18)]" />

                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                      {loading ? "Loading pool…" : "Now playing"}
                    </p>
                    <h2 className="mt-1 select-none font-display text-2xl font-black leading-tight tracking-tight text-white md:text-3xl">
                      {game?.title ?? "Shuffling the night…"}
                    </h2>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {game ? (
                      <span className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-200">
                        {game.game_type.replaceAll("_", " ")}
                      </span>
                    ) : null}
                    <HowToPlayTrigger
                      label="How to play"
                      disabled={!game}
                      onClick={() => setRulesOpen(true)}
                    />
                  </div>
                </div>

                <div className="relative mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={game?.id ?? "none"}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={SPRING}
                    >
                      {game?.game_type === "LUCKY_WHEEL" ||
                      game?.game_type === "ROULETTE" ||
                      game?.game_type === "DARE_WHEEL" ||
                      game?.game_type === "TRUTH_OR_SHOT" ||
                      game?.game_type === "SPIN_THE_BOTTLE" ? (
                        <LuckyWheel
                          labels={
                            game.game_type === "LUCKY_WHEEL"
                              ? rouletteOutcomes
                              : game.game_type === "ROULETTE"
                                ? rouletteOutcomes
                                : game.game_type === "DARE_WHEEL"
                                  ? dares
                                  : game.game_type === "TRUTH_OR_SHOT"
                                    ? [...truthPrompts, "Take the shot"]
                                    : bottleActions
                          }
                          spinning={spinning}
                          onComplete={onEngineComplete}
                        />
                      ) : null}

                      {game?.game_type === "TRUTH_OR_TAB" ? (
                        <TruthOrTabEngine
                          prompts={truthPrompts}
                          seconds={(game.rules_json.seconds as number) ?? 15}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "KINGS_CUP" ? (
                        <KingsCupEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "REACTION_POUR" ? (
                        <ReactionPourEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "NEON_RUNNER" ? (
                        <NeonBarRunner onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "COCKTAIL_SHAKER" ? (
                        <CocktailShakerEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "WHO_PAYS" ? (
                        <WhoPaysEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "TABLE_TRIVIA" ? (
                        <TableTriviaEngine
                          questions={trivia}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "AV_POLL" ? (
                        <AvPollEngine
                          options={avOptions}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "SCRATCH_WIN" ? (
                        <ScratchWinEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "MYSTERY_VAULT" ? (
                        <MysteryVaultEngine onComplete={onEngineComplete} />
                      ) : null}
                      {game?.game_type === "SOBRIETY_REFLEX" ? (
                        <SobrietyReflexEngine onComplete={onEngineComplete} />
                      ) : null}

                      {game?.game_type === "DICE_DUEL" ? (
                        <DiceDuelEngine
                          target={(game.rules_json.target as number) ?? 8}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "HOT_SEAT" ? (
                        <HotSeatEngine
                          prompts={
                            (game.rules_json.prompts as string[]) ?? truthPrompts
                          }
                          seconds={(game.rules_json.seconds as number) ?? 20}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "MEMORY_FLASH" ? (
                        <MemoryFlashEngine
                          levels={(game.rules_json.levels as number) ?? 4}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "BEAT_TAP" ? (
                        <BeatTapEngine
                          taps={(game.rules_json.taps as number) ?? 10}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "TWO_TRUTHS" ? (
                        <TwoTruthsEngine
                          statements={
                            (game.rules_json.statements as string[]) ?? []
                          }
                          lieIndex={(game.rules_json.lieIndex as number) ?? 0}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "RED_LIGHT" ? (
                        <RedLightEngine
                          cues={(game.rules_json.cues as string[]) ?? ["Freeze"]}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "CHARADES" ? (
                        <CharadesEngine
                          prompts={
                            (game.rules_json.prompts as string[]) ?? CHARADE_FALLBACK
                          }
                          seconds={(game.rules_json.seconds as number) ?? 45}
                          onComplete={onEngineComplete}
                        />
                      ) : null}
                      {game?.game_type === "HIGH_LOW" ? (
                        <HighLowEngine
                          rounds={(game.rules_json.rounds as number) ?? 5}
                          onComplete={onEngineComplete}
                        />
                      ) : null}

                      {game?.game_type === "NEVER_HAVE_I_EVER" ? (
                        <NhieVotePanel
                          statement={
                            result ??
                            nhieStatements[
                              Math.floor(Math.random() * nhieStatements.length)
                            ] ??
                            "Never have I ever..."
                          }
                          yes={yes}
                          no={no}
                          onVote={(v) => void vote(v)}
                          burst={voteBurst}
                        />
                      ) : null}

                      {game?.game_type === "MOST_LIKELY_TO" ? (
                        <TablePartyEngine
                          prompt={mostLikelyPrompt}
                          mode="accuse"
                          onComplete={onEngineComplete}
                          onBillPenalty={() => void onPayPenalty()}
                        />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {result &&
                game?.game_type !== "NEVER_HAVE_I_EVER" &&
                game?.game_type !== "MOST_LIKELY_TO" ? (
                  <div className="relative mt-5">
                    <PromptRevealCard title="Landed" body={result} flash={flash} />
                  </div>
                ) : null}

                <div className="relative mt-6 flex flex-wrap gap-3">
                  {game?.game_type === "NEVER_HAVE_I_EVER" ? (
                    <NeonButton
                      className="active:scale-[0.97]"
                      onClick={() =>
                        onEngineComplete(
                          nhieStatements[
                            Math.floor(Math.random() * nhieStatements.length)
                          ] ?? "Never have I ever..."
                        )
                      }
                    >
                      Next Statement
                    </NeonButton>
                  ) : selfPlay ? null : (
                    <NeonButton
                      className="active:scale-[0.97]"
                      onClick={startSpin}
                      disabled={!game || spinning}
                    >
                      {spinning ? "Spinning…" : "Spin the house wheel"}
                    </NeonButton>
                  )}

                  <NeonButton
                    tone="ghost"
                    className="active:scale-[0.97]"
                    onClick={onSurprise}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Surprise Me
                  </NeonButton>

                  <NeonButton
                    tone="gold"
                    className="shadow-glow-gold active:scale-[0.97]"
                    onClick={() => void onPayPenalty()}
                    disabled={
                      !penalty ||
                      (!result &&
                        game?.game_type !== "NEVER_HAVE_I_EVER" &&
                        game?.game_type !== "MOST_LIKELY_TO")
                    }
                  >
                    <Wine className="h-4 w-4" />
                    {upsellLabel || "Pay Penalty / Order Round"}
                  </NeonButton>
                </div>

                {penalty ? (
                  <p className="relative mt-3 text-xs text-zinc-500">
                    Penalty SKU: {penalty.quantity}× {penalty.name} · ₹
                    {penalty.unit_price}
                  </p>
                ) : null}
                {orderedNote ? (
                  <p className="relative mt-2 flex items-center gap-1.5 text-sm text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {orderedNote}
                  </p>
                ) : null}
                {wallet.coupons[0] ? (
                  <p className="relative mt-2 text-xs text-amber-200/80">
                    Latest coupon: {wallet.coupons[0]}
                  </p>
                ) : null}
              </div>
            </GameFlipCard>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Instant play · {filteredPool.length} in view
              </p>
              <p className="shrink-0 text-[11px] text-zinc-500">
                Table {session.primary_table_id.slice(0, 6)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPool.slice(0, 60).map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: Math.min(index * 0.025, 0.35) }}
                  onClick={() => {
                    playGame(item);
                    setOrderedNote(null);
                    void triggerHaptic(12);
                  }}
                  className={cn(SHELL)}
                >
                  <span className="arcade-glow-ray pointer-events-none" aria-hidden />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-lux group-hover:from-violet-500/10 group-hover:to-cyan-500/10 group-hover:opacity-100" />
                  <p className="relative font-mono text-[10px] uppercase tracking-wider text-cyan-400/80">
                    {hubFilterFor(item.game_type)}
                  </p>
                  <p className="relative mt-2 truncate font-display text-lg font-black text-white group-hover:text-violet-100">
                    {item.title}
                  </p>
                  <p className="relative mt-1 text-[11px] text-zinc-400">
                    {item.game_type.replaceAll("_", " ")}
                    {playedGameIds.includes(item.id) ? " · played" : ""}
                  </p>
                </motion.button>
              ))}
            </div>
            {filteredPool.length > 60 ? (
              <p className="mt-3 text-center font-mono text-[11px] text-zinc-500">
                Showing 60 of {filteredPool.length} — search or filter to narrow
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <GameRulesModal
        open={rulesOpen}
        rule={game ? ruleForGame(game.game_type, game.title) : null}
        tableGameTitle={game?.title ?? null}
        tableGameType={game?.game_type ?? null}
        onClose={() => setRulesOpen(false)}
      />
    </AppShell>
  );
}
