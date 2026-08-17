"use client";

import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/NeonButton";

interface MostLikelyPanelProps {
  prompt: string;
  yes: number;
  no: number;
  onVote: (vote: "YES" | "NO") => void;
  burst?: boolean;
}

/**
 * Group vote: YES = "That's me / I nominate them", NO = pass.
 * Loser / most-voted side pays the shot via upsell CTA.
 */
export function MostLikelyPanel({
  prompt,
  yes,
  no,
  onVote,
  burst,
}: MostLikelyPanelProps) {
  const total = Math.max(1, yes + no);
  const yesPct = Math.round((yes / total) * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="space-y-4">
      <motion.div
        key={prompt}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[140px] w-full flex-col justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-lg md:p-8"
      >
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          Most Likely To…
        </p>
        <p className="text-left font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
          {prompt}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <NeonButton tone="gold" onClick={() => onVote("YES")}>
          It&apos;s them / Me
        </NeonButton>
        <NeonButton tone="ghost" onClick={() => onVote("NO")}>
          Pass
        </NeonButton>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Nominated {yes}</span>
          <span>Pass {no}</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="bg-accent-gold"
            animate={{ width: `${yesPct}%`, scale: burst ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          />
          <motion.div
            className="bg-white/25"
            animate={{ width: `${noPct}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
