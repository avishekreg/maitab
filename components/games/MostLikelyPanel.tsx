"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { burstConfetti } from "@/lib/games/confetti";
import { playWinSting } from "@/lib/games/arcade-sfx";
import { useTableRoster, type RosterPlayer } from "@/lib/hooks/use-table-roster";

const PASS_ID = "__pass__";

type Tallies = Record<string, number>;

/** Named-player table accusation / Most Likely To engine */
export function MostLikelyPanel({
  prompt,
  onComplete,
  onBillPenalty,
}: {
  prompt: string;
  onComplete: (outcome: string) => void;
  onBillPenalty?: (playerName: string) => void;
}) {
  const { players, self, tableLabel, addPlayer } = useTableRoster();
  const [tallies, setTallies] = useState<Tallies>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTallies({});
    setPicked(null);
    setRevealed(false);
  }, [prompt]);

  const total = Object.values(tallies).reduce((a, b) => a + b, 0);

  function voteFor(id: string) {
    setTallies((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setPicked(id);
    void triggerHaptic(18);
  }

  const ranked = useMemo(() => {
    return [...players]
      .map((p) => ({
        ...p,
        votes: tallies[p.id] ?? 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [players, tallies]);

  const passVotes = tallies[PASS_ID] ?? 0;
  const leader = ranked[0];
  const passWins = passVotes > (leader?.votes ?? 0);

  function reveal() {
    setRevealed(true);
    playWinSting();
    if (!passWins) burstConfetti(1600);
    const name = passWins ? "Pass" : leader?.name ?? "the table";
    onComplete(`${prompt} → ${name}`);
    void triggerHaptic([40, 30, 60]);
  }

  return (
    <div className="space-y-4">
      <motion.div
        key={prompt}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[140px] w-full flex-col justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-lg md:p-8"
      >
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          Most Likely To… · Table {tableLabel}
        </p>
        <p className="text-left font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
          {prompt}
        </p>
      </motion.div>

      <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        Accuse a named player at the table
      </p>
      <div className="grid grid-cols-2 gap-2">
        {players.map((player) => (
          <PlayerChip
            key={player.id}
            player={player}
            active={picked === player.id}
            votes={tallies[player.id] ?? 0}
            showCount={revealed || total > 0}
            crowned={revealed && !passWins && leader?.id === player.id}
            onClick={() => voteFor(player.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => voteFor(PASS_ID)}
          className={cn(
            "cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-400 transition-all active:scale-[0.98]",
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
          className="shrink-0 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 active:scale-[0.98]"
        >
          Add
        </button>
      </form>

      {/* Live / reveal percentage bars per occupant */}
      {total > 0 ? (
        <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {revealed ? "Final tally" : "Live votes"}
          </p>
          {ranked.map((p) => {
            const pct = Math.round((p.votes / Math.max(total, 1)) * 100);
            const isLeader = revealed && !passWins && leader?.id === p.id;
            return (
              <div key={p.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={cn(
                      "font-semibold text-zinc-200",
                      isLeader && "text-amber-300"
                    )}
                  >
                    {isLeader ? (
                      <Crown className="mr-1 inline h-3.5 w-3.5 text-amber-300" />
                    ) : null}
                    {p.isSelf ? `${p.name} (Me)` : p.name}
                  </span>
                  <span className="font-mono tabular-nums text-zinc-400">
                    {p.votes} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className={cn(
                      "h-full rounded-full",
                      isLeader
                        ? "bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_12px_rgba(245,158,11,0.55)]"
                        : p.isSelf
                          ? "bg-violet-500"
                          : "bg-cyan-500/80"
                    )}
                  />
                </div>
              </div>
            );
          })}
          {passVotes > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Pass</span>
                <span className="font-mono tabular-nums">
                  {passVotes} ·{" "}
                  {Math.round((passVotes / Math.max(total, 1)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-500"
                  style={{
                    width: `${(passVotes / Math.max(total, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={reveal}
        disabled={total === 0}
        className="w-full cursor-pointer rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lock Votes / Reveal
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence mode="wait">
              {revealed ? (
                <CalloutModal
                  key="accuse-reveal"
                  passWins={passWins}
                  leader={leader}
                  total={total}
                  selfId={self.id}
                  onClose={() => setRevealed(false)}
                  onBill={() => {
                    if (leader && !passWins) onBillPenalty?.(leader.name);
                    setRevealed(false);
                  }}
                  onImmunity={() => setRevealed(false)}
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
          ? "border border-violet-500/50 bg-violet-950/40 text-violet-200 hover:bg-violet-600 hover:text-white"
          : "border border-zinc-700/80 bg-zinc-900 text-zinc-100 hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200",
        active &&
          (player.isSelf
            ? "ring-2 ring-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]"
            : "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)]"),
        crowned && "border-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
      )}
    >
      {crowned ? (
        <Crown className="absolute right-2 top-2 h-3.5 w-3.5 text-amber-300" />
      ) : null}
      <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-mono text-zinc-300">
        {player.isSelf ? "Me" : player.name.slice(0, 1).toUpperCase()}
      </span>
      {player.isSelf ? `${player.name}` : player.name}
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

function CalloutModal({
  passWins,
  leader,
  total,
  selfId,
  onClose,
  onBill,
  onImmunity,
}: {
  passWins: boolean;
  leader?: RosterPlayer & { votes: number };
  total: number;
  selfId: string;
  onClose: () => void;
  onBill: () => void;
  onImmunity: () => void;
}) {
  const selfWon = !passWins && leader?.id === selfId;
  const title = passWins
    ? "Everyone passed — 2× stakes next prompt."
    : selfWon
      ? `Self-aware — ${leader?.name} owned it.`
      : `${leader?.name ?? "Someone"} got called out`;
  const body = passWins
    ? "Pass won the table. Next prompt runs at double stakes."
    : selfWon
      ? "The table drinks on you — or take immunity."
      : "Guilty as charged. The table has spoken.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative z-[1000] w-full max-w-md rounded-3xl border border-amber-400/40 bg-zinc-950 p-6 text-white shadow-[0_0_50px_rgba(245,158,11,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {!passWins ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
            <Crown className="h-3.5 w-3.5" />
            Most accused
          </div>
        ) : null}
        <p className="font-display text-2xl font-black leading-snug">{title}</p>
        <p className="mt-2 text-sm text-zinc-300">{body}</p>
        {!passWins && leader ? (
          <p className="mt-3 font-mono text-xs font-bold text-amber-300">
            {leader.votes} of {total} table votes · 1× Penalty Shooter billed to{" "}
            {leader.name}&apos;s tab
          </p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {!passWins ? (
            <>
              <button
                type="button"
                onClick={onBill}
                className="cursor-pointer rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 active:scale-[0.98]"
              >
                Bill 1× Penalty Shot (₹280) to {leader?.name}&apos;s Tab
              </button>
              <button
                type="button"
                onClick={onImmunity}
                className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200 active:scale-[0.98]"
              >
                Forfeit Immunity
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-violet-600 py-3 text-sm font-bold text-white active:scale-[0.98]"
            >
              Next prompt at 2× stakes
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export { MostLikelyPanel as MostLikelyTo };
