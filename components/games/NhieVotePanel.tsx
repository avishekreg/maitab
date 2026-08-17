"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NhieVotePanelProps {
  statement: string;
  yes: number;
  no: number;
  onVote: (vote: "YES" | "NO") => void;
  burst?: boolean;
}

export function NhieVotePanel({
  statement,
  yes,
  no,
  onVote,
  burst,
}: NhieVotePanelProps) {
  const total = yes + no;
  const yesPct = total === 0 ? 0 : Math.round((yes / total) * 100);
  const noPct = total === 0 ? 0 : 100 - yesPct;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-lg backdrop-blur-xl md:p-8">
      {burst
        ? Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-accent-violet"
              initial={{ opacity: 1, x: "50%", y: "40%", scale: 1 }}
              animate={{
                opacity: 0,
                x: `${20 + Math.random() * 60}%`,
                y: `${10 + Math.random() * 70}%`,
                scale: 0,
              }}
              transition={{ duration: 0.8 }}
            />
          ))
        : null}

      <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
        Never Have I Ever
      </p>
      <p className="text-left font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
        {statement}
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>I have</span>
            <span className="rounded-full bg-accent-violet/20 px-2 py-0.5 text-accent-violet">
              {yes}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-accent-violet"
              animate={{ width: `${yesPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Never</span>
            <span className="rounded-full bg-accent-ruby/20 px-2 py-0.5 text-accent-ruby">
              {no}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-accent-ruby"
              animate={{ width: `${noPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onVote("YES")}
          className={cn(
            "h-12 rounded-xl border border-accent-violet/40 bg-accent-violet/15 font-semibold text-accent-violet"
          )}
        >
          I have
        </button>
        <button
          type="button"
          onClick={() => onVote("NO")}
          className="h-12 rounded-xl border border-accent-ruby/40 bg-accent-ruby/15 font-semibold text-accent-ruby"
        >
          Never
        </button>
      </div>
    </div>
  );
}
