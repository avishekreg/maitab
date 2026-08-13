"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles, Wine } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GameFlipCard, PromptRevealCard } from "@/components/games/GameFlipCard";
import { MostLikelyPanel } from "@/components/games/MostLikelyPanel";
import { NeonSpinWheel } from "@/components/games/NeonSpinWheel";
import { NhieVotePanel } from "@/components/games/NhieVotePanel";
import { ShotRouletteEngine } from "@/components/games/ShotRouletteEngine";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierGlassCard } from "@/components/theme/TierChrome";
import { catalogStats } from "@/lib/games/100_games_catalog";
import { castGameVote } from "@/lib/data/games";
import { useGameVotesRealtime } from "@/lib/hooks/use-game-votes-realtime";
import { useSurpriseGame } from "@/lib/hooks/use-surprise-game";
import { publishBus } from "@/lib/realtime/bus";
import { useSessionStore } from "@/lib/store/session-store";
import { triggerHaptic } from "@/lib/utils";

export default function GamePage() {
  const session = useSessionStore((s) => s.session);
  const user = useSessionStore((s) => s.user);
  const [voteBurst, setVoteBurst] = useState(false);
  const [orderedNote, setOrderedNote] = useState<string | null>(null);

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
    completeRound,
    fulfillPenalty,
    playedGameIds,
  } = useSurpriseGame({ groupSize: 4 });

  const { yes, no } = useGameVotesRealtime(session.id, game?.id ?? null);
  const stats = useMemo(() => catalogStats(), []);

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

  function onSurprise() {
    surpriseMe();
    void triggerHaptic(25);
    setOrderedNote(null);
  }

  function startSpin() {
    if (!game || spinning) return;
    setSpinning(true);
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

  const recentPool = pool.slice(0, 12);

  return (
    <AppShell title="Table Games">
      <div className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Surprise Engine
            </h1>
            <p className="mt-1 text-sm text-nightlife-muted">
              {catalogSize}+ nightlife games · weighted · no-repeat for 2h
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${remaining} left`} tone="emerald" />
            <StatusPill label={`${playedCount} played`} tone="muted" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-nightlife-muted">
          {Object.entries(stats).map(([type, count]) => (
            <span
              key={type}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"
            >
              {type.replaceAll("_", " ")} · {count}
            </span>
          ))}
        </div>
      </div>

      <GameFlipCard flipKey={game?.id ?? "empty"}>
        <TierGlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-nightlife-muted">
                {loading ? "Loading pool…" : "Now playing"}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                {game?.title ?? "Shuffling the night…"}
              </h2>
            </div>
            {game ? <StatusPill label={game.game_type} tone="violet" /> : null}
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={game?.id ?? "none"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28 }}
              >
                {game?.game_type === "ROULETTE" ? (
                  <ShotRouletteEngine
                    outcomes={rouletteOutcomes}
                    spinning={spinning}
                    onComplete={completeRound}
                  />
                ) : null}

                {game?.game_type === "DARE_WHEEL" ||
                game?.game_type === "TRUTH_OR_SHOT" ||
                game?.game_type === "SPIN_THE_BOTTLE" ? (
                  <NeonSpinWheel
                    labels={
                      game.game_type === "DARE_WHEEL"
                        ? dares
                        : game.game_type === "TRUTH_OR_SHOT"
                          ? [...truthPrompts, "Take the shot"]
                          : bottleActions
                    }
                    spinning={spinning}
                    onComplete={completeRound}
                    accent={
                      game.game_type === "DARE_WHEEL" ? "#F59E0B" : "#8B5CF6"
                    }
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
                  completeRound(
                    nhieStatements[
                      Math.floor(Math.random() * nhieStatements.length)
                    ] ?? "Never have I ever..."
                  )
                }
              >
                Next Statement
              </NeonButton>
            ) : game?.game_type === "MOST_LIKELY_TO" ? (
              <NeonButton
                onClick={() => completeRound(mostLikelyPrompt)}
              >
                Lock Votes / Reveal
              </NeonButton>
            ) : (
              <NeonButton onClick={startSpin} disabled={!game || spinning}>
                {spinning ? "Spinning…" : "Spin / Play"}
              </NeonButton>
            )}

            <NeonButton tone="ghost" onClick={onSurprise}>
              <RefreshCw className="h-4 w-4" />
              Surprise Me / Next Game
            </NeonButton>

            <NeonButton
              tone="gold"
              onClick={() => void onPayPenalty()}
              disabled={
                !penalty ||
                (!result &&
                  game?.game_type !== "NEVER_HAVE_I_EVER" &&
                  game?.game_type !== "MOST_LIKELY_TO")
              }
            >
              <Wine className="h-4 w-4" />
              {upsellLabel}
            </NeonButton>
          </div>

          {penalty ? (
            <p className="mt-3 text-xs text-nightlife-muted">
              Penalty SKU: {penalty.quantity}× {penalty.name} · ₹
              {penalty.unit_price}
            </p>
          ) : null}
          {orderedNote ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-accent-emerald">
              <Sparkles className="h-3.5 w-3.5" />
              {orderedNote}
            </p>
          ) : null}
        </TierGlassCard>
      </GameFlipCard>

      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-nightlife-muted">
          Pool preview · {catalogSize} total
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentPool.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-white">{item.title}</p>
                <StatusPill
                  label={playedGameIds.includes(item.id) ? "Played" : "Pool"}
                  tone={playedGameIds.includes(item.id) ? "muted" : "violet"}
                />
              </div>
              <p className="mt-1 text-[11px] text-nightlife-muted">
                {item.game_type.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
