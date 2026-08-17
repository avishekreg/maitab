"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { GameRule } from "@/lib/games/rules-registry";

export function HowToPlayTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-300 transition-all hover:border-violet-500 hover:text-white"
    >
      ❔ How to Play &amp; Rules
    </button>
  );
}

export function GameRulesModal({
  open,
  rule,
  onClose,
}: {
  open: boolean;
  rule: GameRule | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && rule ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Close rules"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-rules-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative z-50 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-200">
                  {rule.category.replaceAll("_", " ")}
                </span>
                <h2
                  id="game-rules-title"
                  className="mt-2 font-display text-2xl font-black tracking-tight text-white"
                >
                  {rule.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{rule.tagline}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-950/30 p-3.5 text-xs font-medium text-violet-200">
              {rule.objective}
            </div>

            <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              How it works
            </p>
            <ol className="mt-2 space-y-2">
              {rule.howToPlay.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-zinc-200">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-800 font-mono text-[11px] font-bold text-violet-200">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 space-y-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-3 text-sm text-emerald-200">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  🏆 Winning condition
                </p>
                <p className="mt-1">{rule.winCondition}</p>
                <p className="mt-1 text-xs text-emerald-300/80">
                  Reward: {rule.penaltiesAndRewards.winner}
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 px-3.5 py-3 text-sm text-rose-100">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  ❌ Loss condition &amp; penalty
                </p>
                <p className="mt-1">{rule.lossCondition}</p>
                <p className="mt-1 text-xs text-amber-200">
                  Penalty: {rule.penaltiesAndRewards.loser}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3.5 py-3 text-sm text-zinc-200">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  ⚖️ Tie-breaker
                </p>
                <p className="mt-1">{rule.drawOrTieRule}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  ✅ DOs
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
                  {rule.dos.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  🚫 DON&apos;Ts
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
                  {rule.donts.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500"
            >
              🎮 Got It, Let&apos;s Play!
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
