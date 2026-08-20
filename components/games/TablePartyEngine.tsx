"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Radio, Timer, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { cn, triggerHaptic } from "@/lib/utils";
import { playWinSting } from "@/lib/games/arcade-sfx";
import { useTablePartySync } from "@/lib/hooks/use-table-party-sync";
import type { RosterPlayer } from "@/lib/hooks/use-table-roster";

const PASS_ID = "__pass__";

/**
 * Host/controller party loop for the table (VIP-04 etc.) —
 * patterns inspired by Open-Party-Lab + Quiplash, synced locally
 * across devices on the same table session.
 */
export function TablePartyEngine({
  prompt,
  mode = "accuse",
  onComplete,
  onBillPenalty,
}: {
  prompt: string;
  mode?: "accuse" | "buzz";
  onComplete: (outcome: string) => void;
  onBillPenalty?: (playerName: string) => void;
}) {
  const {
    state,
    players,
    self,
    tableLabel,
    totalVotes,
    leader,
    addPlayer,
    startCountdown,
    castVote,
    buzz,
    reveal,
    resetRound,
  } = useTablePartySync(prompt);
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showCallout, setShowCallout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onVote(id: string) {
    setPicked(id);
    castVote(id);
    void triggerHaptic(16);
  }

  function onReveal() {
    reveal();
    playWinSting();
    confetti({
      particleCount: 90,
      spread: 68,
      origin: { y: 0.4 },
      zIndex: 1200,
      colors: ["#FDE68A", "#A78BFA", "#22D3EE"],
      disableForReducedMotion: true,
    });
    const name = leader?.name ?? "Pass";
    onComplete(`${prompt} → ${name}`);
    setShowCallout(true);
    void triggerHaptic([40, 30, 60]);
  }

  const passVotes = state.tallies[PASS_ID] ?? 0;
  const passWins = passVotes > (leader?.votes ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-950/20 px-3 py-2">
        <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Live table sync · {tableLabel}
        </p>
        <p className="font-mono text-[10px] text-zinc-500">
          Phase · {state.phase}
        </p>
      </div>

      <motion.div
        key={prompt}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[130px] flex-col justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 md:p-8"
      >
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
          {mode === "buzz" ? "Table buzzer" : "Accusation round"} · {tableLabel}
        </p>
        <p className="font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
          {prompt}
        </p>
      </motion.div>

      {/* Shared countdown */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => startCountdown(15)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 active:scale-[0.98]"
        >
          <Timer className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
          Start 15s countdown
        </button>
        {state.phase === "countdown" ? (
          <span className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 font-mono text-sm font-bold tabular-nums text-violet-200">
            {state.secondsLeft}s
          </span>
        ) : null}
        {mode === "buzz" ? (
          <button
            type="button"
            onClick={buzz}
            disabled={Boolean(state.buzzedBy)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white active:scale-[0.98] disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Buzz
          </button>
        ) : null}
        <button
          type="button"
          onClick={resetRound}
          className="cursor-pointer rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200"
        >
          Reset round
        </button>
      </div>

      {state.buzzedBy ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          First buzz:{" "}
          {players.find((p) => p.id === state.buzzedBy)?.name ?? "Player"}
        </p>
      ) : null}

      {mode === "accuse" ? (
        <>
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Who fits this prompt?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => (
              <PlayerChip
                key={player.id}
                player={player}
                active={picked === player.id}
                votes={state.tallies[player.id] ?? 0}
                showCount={totalVotes > 0}
                crowned={
                  state.revealed && !passWins && leader?.id === player.id
                }
                onClick={() => onVote(player.id)}
              />
            ))}
            <button
              type="button"
              onClick={() => onVote(PASS_ID)}
              className={cn(
                "cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-400 active:scale-[0.98]",
                picked === PASS_ID &&
                  "ring-2 ring-zinc-300 shadow-[0_0_16px_rgba(212,212,216,0.35)]"
              )}
            >
              Pass
            </button>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addPlayer(draft);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="+ Add player name"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200"
            >
              Add
            </button>
          </form>

          {totalVotes > 0 ? (
            <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {state.revealed ? "Final tally" : "Live votes (synced)"}
              </p>
              {players.map((p) => {
                const votes = state.tallies[p.id] ?? 0;
                const pct = Math.round((votes / Math.max(totalVotes, 1)) * 100);
                const isLeader =
                  state.revealed && !passWins && leader?.id === p.id;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span
                        className={cn(
                          "font-semibold text-zinc-200",
                          isLeader && "text-amber-300"
                        )}
                      >
                        {isLeader ? (
                          <Crown className="mr-1 inline h-3.5 w-3.5" />
                        ) : null}
                        {p.isSelf ? `${p.name} (Me)` : p.name}
                      </span>
                      <span className="font-mono tabular-nums text-zinc-400">
                        {votes} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        className={cn(
                          "h-full rounded-full",
                          isLeader
                            ? "bg-gradient-to-r from-amber-400 to-rose-500"
                            : p.isSelf
                              ? "bg-violet-500"
                              : "bg-cyan-500/80"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onReveal}
            disabled={totalVotes === 0}
            className="w-full cursor-pointer rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 active:scale-[0.98] disabled:opacity-40"
          >
            Lock Votes / Reveal
          </button>
        </>
      ) : null}

      {mounted
        ? createPortal(
            <AnimatePresence>
              {showCallout && state.revealed ? (
                <Callout
                  key="party-callout"
                  passWins={passWins}
                  leader={leader}
                  total={totalVotes}
                  selfId={self.id}
                  onClose={() => setShowCallout(false)}
                  onBill={() => {
                    if (leader && !passWins) onBillPenalty?.(leader.name);
                    setShowCallout(false);
                  }}
                />
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}

function PlayerChip({
  player,
  active,
  votes,
  showCount,
  crowned,
  onClick,
}: {
  player: RosterPlayer;
  active: boolean;
  votes: number;
  showCount: boolean;
  crowned?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl px-4 py-3 text-left font-display text-sm font-bold transition-all active:scale-[0.98]",
        player.isSelf
          ? "border border-violet-500/50 bg-violet-950/40 text-violet-200"
          : "border border-zinc-700/80 bg-zinc-900 text-zinc-100",
        active &&
          (player.isSelf
            ? "ring-2 ring-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]"
            : "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)]"),
        crowned && "border-amber-400/70"
      )}
    >
      {crowned ? (
        <Crown className="absolute right-2 top-2 h-3.5 w-3.5 text-amber-300" />
      ) : null}
      <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] text-zinc-300">
        {player.isSelf ? "Me" : player.name.slice(0, 1).toUpperCase()}
      </span>
      {player.name}
      {player.isSelf ? (
        <span className="ml-1 font-mono text-[10px] font-normal opacity-70">
          (Me)
        </span>
      ) : null}
      {showCount ? (
        <span className="ml-2 font-mono text-[11px] opacity-80">{votes}</span>
      ) : null}
    </button>
  );
}

function Callout({
  passWins,
  leader,
  total,
  selfId,
  onClose,
  onBill,
}: {
  passWins: boolean;
  leader: (RosterPlayer & { votes: number }) | null;
  total: number;
  selfId: string;
  onClose: () => void;
  onBill: () => void;
}) {
  const selfWon = !passWins && leader?.id === selfId;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-[1000] w-full max-w-md rounded-3xl border border-amber-400/40 bg-zinc-950 p-6 text-white shadow-[0_0_50px_rgba(245,158,11,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-2xl font-black">
          {passWins
            ? "Everyone passed — 2× stakes next."
            : selfWon
              ? `${leader?.name} owned it.`
              : `${leader?.name ?? "Someone"} got called out`}
        </p>
        {!passWins && leader ? (
          <p className="mt-3 font-mono text-xs font-bold text-amber-300">
            {leader.votes}/{total} votes · 1× Penalty Shooter billed to{" "}
            {leader.name}&apos;s tab
          </p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {!passWins ? (
            <button
              type="button"
              onClick={onBill}
              className="cursor-pointer rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950"
            >
              Bill 1× Penalty Shot to {leader?.name}&apos;s Tab
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200"
          >
            Back to table
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
