"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GameRulesModal } from "@/components/games/GameRulesModal";
import {
  RULE_CATEGORIES,
  catalogRulebook,
  type GameRule,
  type GameRuleCategory,
} from "@/lib/games/rules-registry";

export default function GameRulesDirectoryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GameRuleCategory | "ALL">("ALL");
  const [open, setOpen] = useState<GameRule | null>(null);
  const all = useMemo(() => catalogRulebook(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((rule) => {
      if (category !== "ALL" && rule.category !== category) return false;
      if (!q) return true;
      return (
        rule.name.toLowerCase().includes(q) ||
        rule.tagline.toLowerCase().includes(q) ||
        rule.objective.toLowerCase().includes(q) ||
        rule.category.toLowerCase().includes(q)
      );
    });
  }, [all, category, query]);

  return (
    <AppShell title="Rulebook">
      <div className="w-full max-w-full overflow-x-hidden rounded-[2rem] border border-zinc-800 bg-[#07080c] px-4 py-6 text-white sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">
              House rulebook
            </p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
              How to play {all.length}+ games
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Mechanics, odds-style outcomes, tab penalties, and nightlife DOs / DON&apos;Ts.
            </p>
          </div>
          <Link
            href="/game"
            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
          >
            Back to arcade
          </Link>
        </div>

        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search game name, category, penalty…"
            className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-900/80 py-3 pl-11 pr-5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
          />
        </label>

        <div className="no-scrollbar mt-4 flex w-full min-w-0 gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RULE_CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={
                category === tab.id
                  ? "shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white"
                  : "shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500">{filtered.length} entries</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => setOpen(rule)}
              className="rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-5 text-left shadow-lg transition hover:border-violet-500/50"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-violet-300">
                {rule.category.replaceAll("_", " ")}
              </p>
              <p className="mt-1 font-display text-lg font-black text-white">
                {rule.name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{rule.tagline}</p>
              <p className="mt-3 text-[11px] text-amber-200/90">
                Penalty: {rule.penaltiesAndRewards.loser}
              </p>
            </button>
          ))}
        </div>
      </div>

      <GameRulesModal open={Boolean(open)} rule={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
