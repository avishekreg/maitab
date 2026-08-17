"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, triggerHaptic } from "@/lib/utils";
import { burstConfetti } from "@/lib/games/confetti";
import { playWinSting } from "@/lib/games/arcade-sfx";
import { useTableRoster, type RosterPlayer } from "@/lib/hooks/use-table-roster";

const PASS_ID = "__pass__";

type Tallies = Record<string, number>;

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
        Who fits this prompt?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {players.map((player) => (
          <PlayerChip
            key={player.id}
            player={player}
            active={picked === player.id}
            votes={tallies[player.id] ?? 0}
            showCount={revealed || total > 0}
            onClick={() => voteFor(player.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => voteFor(PASS_ID)}
          className={cn(
            "rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-400 transition-all",
            picked === PASS_ID && "ring-2 ring-zinc-400"
          )}
        >
          ⏭️ Pass / Skip
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
          className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200"
        >
          Add
        </button>
      </form>

      {total > 0 ? (
        <div className="space-y-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
            {ranked.map((p) =>
              p.votes ? (
                <div
                  key={p.id}
                  className={cn(
                    "h-full transition-all duration-300",
                    p.isSelf ? "bg-violet-500" : "bg-amber-400"
                  )}
                  style={{ width: `${(p.votes / Math.max(total, 1)) * 100}%` }}
                />
              ) : null
            )}
            {passVotes ? (
              <div
                className="h-full bg-zinc-600 transition-all duration-300"
                style={{ width: `${(passVotes / Math.max(total, 1)) * 100}%` }}
              />
            ) : null}
          </div>
          {revealed
            ? ranked
                .filter((p) => p.votes > 0)
                .map((p) => (
                  <p
                    key={p.id}
                    className="font-mono text-xs font-bold text-zinc-300"
                  >
                    {p.name}: {p.votes} votes (
                    {Math.round((p.votes / Math.max(total, 1)) * 100)}%)
                  </p>
                ))
            : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={reveal}
        disabled={total === 0}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-40"
      >
        Lock Votes / Reveal
      </button>

      <AnimatePresence>
        {revealed ? (
          <CalloutModal
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
      </AnimatePresence>
    </div>
  );
}

function PlayerChip({
  player,
  active,
  votes,
  showCount,
  onClick,
}: {
  player: RosterPlayer;
  active: boolean;
  votes: number;
  showCount: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-3 text-left font-display text-sm font-bold transition-all",
        player.isSelf
          ? "border border-violet-500/50 bg-violet-950/40 text-violet-200 hover:bg-violet-600 hover:text-white"
          : "border border-zinc-700/80 bg-zinc-900 text-zinc-100 hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200",
        active &&
          (player.isSelf
            ? "ring-2 ring-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]"
            : "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)]")
      )}
    >
      {player.isSelf ? "🙋‍♂️ " : "👤 "}
      {player.name}
      {player.isSelf ? " (Me)" : ""}
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
    ? "Everyone chickened out! 2× stakes on next prompt."
    : selfWon
      ? `Self-Aware Legend! ${leader?.name} owned it.`
      : `🔥 ${leader?.name ?? "Someone"} GOT CALLED OUT!`;
  const body = passWins
    ? "Pass won the table. Next prompt runs at double stakes."
    : selfWon
      ? "The table drinks on you — or take immunity."
      : "Guilty as charged! The table has spoken.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] grid place-items-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-amber-400/40 bg-zinc-950 p-6 text-white shadow-[0_0_50px_rgba(245,158,11,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-2xl font-black leading-snug">{title}</p>
        <p className="mt-2 text-sm text-zinc-300">{body}</p>
        {!passWins && leader ? (
          <p className="mt-3 font-mono text-xs font-bold text-amber-300">
            {leader.votes} out of {total} table votes
          </p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {!passWins ? (
            <>
              <button
                type="button"
                onClick={onBill}
                className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950"
              >
                🥃 Bill 1x Penalty Shot (₹280) to {leader?.name}&apos;s Tab
              </button>
              <button
                type="button"
                onClick={onImmunity}
                className="rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200"
              >
                ⚡ Forfeit Immunity
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-violet-600 py-3 text-sm font-bold text-white"
            >
              Next prompt at 2× stakes
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
