"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import type { GameRule } from "@/lib/games/rules-registry";

const FALLBACK_RULE: GameRule = {
  id: "table-fallback",
  name: "Table Rules",
  category: "TABLE_DARES",
  tagline: "House rules for the game loaded on this table.",
  objective:
    "Play the active table game fairly — complete the prompt, spin, or vote before the forfeit hits the tab.",
  howToPlay: [
    "Confirm everyone at the table understands the active game title.",
    "Take turns as the engine prompts — spin, tap, vote, or answer.",
    "Landed outcomes are binding unless the table unanimously passes.",
    "Use Pay Penalty / Order Round to settle forfeits on the personal tab.",
  ],
  winCondition: "Completing the round unlocks arcade credits or a house coupon.",
  lossCondition: "Failing or bailing triggers the mapped penalty SKU on tab.",
  drawOrTieRule: "Ties re-run once; a second tie splits the forfeit.",
  penaltiesAndRewards: {
    winner: "Arcade credits + table immunity chip",
    loser: "1× mapped shot / bite SKU on personal tab",
  },
  dos: [
    "Keep dares consensual — anyone can pass without shame.",
    "Respect staff, neighboring tables, and the dance floor.",
    "Pace drinks with water between rounds.",
  ],
  donts: [
    "Never force anyone to drink, reveal, or perform.",
    "Do not target one person continuously.",
    "No glassware on the dance floor.",
  ],
};

export function HowToPlayTrigger({
  onClick,
  disabled,
  label = "Rules",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-300 transition-all hover:border-violet-500 hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <BookOpen className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

export function GameRulesModal({
  open,
  rule,
  onClose,
  tableGameTitle,
  tableGameType,
}: {
  open: boolean;
  rule: GameRule | null;
  onClose: () => void;
  tableGameTitle?: string | null;
  tableGameType?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const resolved = useMemo(() => {
    if (rule && Array.isArray(rule.howToPlay) && rule.howToPlay.length > 0) {
      return rule;
    }
    return {
      ...FALLBACK_RULE,
      name: tableGameTitle || FALLBACK_RULE.name,
      tagline: tableGameTitle
        ? `${FALLBACK_RULE.tagline} · ${tableGameTitle}`
        : FALLBACK_RULE.tagline,
    };
  }, [rule, tableGameTitle]);

  const heading = tableGameTitle || resolved.name;
  const typeLabel = (tableGameType || resolved.category || "")
    .replaceAll("_", " ")
    .toUpperCase();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key={resolved.id || "rules-modal"}
          role="presentation"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-rules-title"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-[1000] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                  On this table only
                </p>
                {typeLabel ? (
                  <span className="mt-2 inline-flex rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-200">
                    {typeLabel}
                  </span>
                ) : null}
                <h2
                  id="game-rules-title"
                  className="mt-2 font-display text-2xl font-black tracking-tight text-white"
                >
                  {heading}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{resolved.tagline}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-950/25 p-3.5 text-xs font-medium leading-relaxed text-cyan-100/90">
              Rules for the game currently loaded on your table — not the full
              arcade catalog.
            </div>

            <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-950/30 p-3.5 text-xs font-medium text-violet-200">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Objective
              </p>
              <p className="mt-1">{resolved.objective}</p>
            </div>

            <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              How to play
            </p>
            <ol className="mt-2 space-y-2">
              {resolved.howToPlay.map((step, i) => (
                <li key={`${i}-${step.slice(0, 24)}`} className="flex gap-3 text-sm text-zinc-200">
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
                  Winning condition
                </p>
                <p className="mt-1">{resolved.winCondition}</p>
                <p className="mt-1 text-xs text-emerald-300/80">
                  Reward: {resolved.penaltiesAndRewards.winner}
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 px-3.5 py-3 text-sm text-rose-100">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  Loss condition &amp; penalty
                </p>
                <p className="mt-1">{resolved.lossCondition}</p>
                <p className="mt-1 text-xs text-amber-200">
                  Penalty: {resolved.penaltiesAndRewards.loser}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3.5 py-3 text-sm text-zinc-200">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Tie-breaker
                </p>
                <p className="mt-1">{resolved.drawOrTieRule}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  DOs
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
                  {resolved.dos.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  DON&apos;Ts
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
                  {resolved.donts.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full cursor-pointer rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
            >
              Got it — back to the table
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
