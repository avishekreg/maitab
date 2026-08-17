"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Search, Sparkles, Trophy, Wine } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  AvPollEngine,
  CocktailShakerEngine,
  KingsCupEngine,
  MysteryVaultEngine,
  NeonBarRunner,
  ReactionPourEngine,
  ScratchWinEngine,
  SobrietyReflexEngine,
  TableTriviaEngine,
  TruthOrTabEngine,
  WhoPaysEngine,
} from "@/components/games/arcade-engines";
import { GameFlipCard, PromptRevealCard } from "@/components/games/GameFlipCard";
import { LuckyWheel } from "@/components/games/lucky-wheel";
import { MostLikelyPanel } from "@/components/games/MostLikelyPanel";
import { NhieVotePanel } from "@/components/games/NhieVotePanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { HUB_TABS, hubFilterFor, type HubFilter } from "@/lib/games/arcade-expansion";
import {
  creditArcadeReward,
  readArcadeWallet,
  type ArcadeWallet,
} from "@/lib/games/arcade-wallet";
import { catalogStats } from "@/lib/games/100_games_catalog";
import { castGameVote } from "@/lib/data/games";
import { useGameVotesRealtime } from "@/lib/hooks/use-game-votes-realtime";
import { useSurpriseGame } from "@/lib/hooks/use-surprise-game";
import { publishBus } from "@/lib/realtime/bus";
import { useSessionStore } from "@/lib/store/session-store";
import { cn, triggerHaptic } from "@/lib/utils";

const SHELL =
  "select-none rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] group";

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
]);

export default function GamePage() {
  const session = useSessionStore((s) => s.session);
  const user = useSessionStore((s) => s.user);
  const [voteBurst, setVoteBurst] = useState(false);
  const [orderedNote, setOrderedNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<HubFilter>("all");
  const [query, setQuery] = useState("");
  const [wallet, setWallet] = useState<ArcadeWallet>({ points: 120, coupons: [] });

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
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#07080c] px-4 py-6 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_10%_-10%,rgba(124,58,237,0.22),transparent_55%),radial-gradient(700px_360px_at_90%_0%,rgba(6,182,212,0.14),transparent_50%)]" />

        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">
                High-voltage nightlife arcade
              </p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
                {catalogSize}+ table games
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Inertia wheels, dares, reflex arcade, and live table clash.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-200 shadow-lg">
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              <span className="font-mono font-bold">{wallet.points} pts</span>
              <span className="text-zinc-500">·</span>
              <span>{wallet.coupons.length} coupons</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {HUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={
                  filter === tab.id
                    ? "shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25"
                    : "shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU dares, wheels, reflex, trivia…"
              className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-900/80 py-3 pl-11 pr-5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span className="rounded-full border border-zinc-800 px-2.5 py-1">
              {remaining} unplayed
            </span>
            <span className="rounded-full border border-zinc-800 px-2.5 py-1">
              {playedCount} played
            </span>
            {Object.entries(stats)
              .slice(0, 6)
              .map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full border border-zinc-800 px-2.5 py-1"
                >
                  {type.replaceAll("_", " ")} · {count}
                </span>
              ))}
          </div>

          <div className="mt-6">
            <GameFlipCard flipKey={game?.id ?? "empty"}>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_0_40px_rgba(124,58,237,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {loading ? "Loading pool…" : "Now playing"}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-black text-white">
                      {game?.title ?? "Shuffling the night…"}
                    </h2>
                  </div>
                  {game ? (
                    <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-violet-200">
                      {game.game_type.replaceAll("_", " ")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={game?.id ?? "none"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
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
                        <MostLikelyPanel
                          prompt={mostLikelyPrompt}
                          yes={yes}
                          no={no}
                          onVote={(v) => void vote(v)}
                          burst={voteBurst}
                        />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {result &&
                game?.game_type !== "NEVER_HAVE_I_EVER" &&
                game?.game_type !== "MOST_LIKELY_TO" ? (
                  <div className="mt-5">
                    <PromptRevealCard title="Landed" body={result} flash={flash} />
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  {game?.game_type === "NEVER_HAVE_I_EVER" ? (
                    <NeonButton
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
                  ) : game?.game_type === "MOST_LIKELY_TO" ? (
                    <NeonButton onClick={() => onEngineComplete(mostLikelyPrompt)}>
                      Lock Votes / Reveal
                    </NeonButton>
                  ) : selfPlay ? null : (
                    <NeonButton onClick={startSpin} disabled={!game || spinning}>
                      {spinning ? "Spinning…" : "Spin the house wheel"}
                    </NeonButton>
                  )}

                  <NeonButton tone="ghost" onClick={onSurprise}>
                    <RefreshCw className="h-4 w-4" />
                    Surprise Me
                  </NeonButton>

                  <NeonButton
                    tone="gold"
                    className="shadow-glow-gold"
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
                  <p className="mt-3 text-xs text-zinc-500">
                    Penalty SKU: {penalty.quantity}× {penalty.name} · ₹
                    {penalty.unit_price}
                  </p>
                ) : null}
                {orderedNote ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {orderedNote}
                  </p>
                ) : null}
                {wallet.coupons[0] ? (
                  <p className="mt-2 text-xs text-amber-200/80">
                    Latest coupon: {wallet.coupons[0]}
                  </p>
                ) : null}
              </div>
            </GameFlipCard>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Instant play · {filteredPool.length} in view
              </p>
              <p className="text-[11px] text-zinc-500">
                Table {session.primary_table_id.slice(0, 6)} vs neighboring booths
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPool.slice(0, 24).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playGame(item);
                    setOrderedNote(null);
                    void triggerHaptic(12);
                  }}
                  className={cn(SHELL, "text-left")}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {hubFilterFor(item.game_type)}
                  </p>
                  <p className="mt-2 truncate font-display text-lg font-black text-white group-hover:text-violet-200">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    {item.game_type.replaceAll("_", " ")}
                    {playedGameIds.includes(item.id) ? " · played" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
