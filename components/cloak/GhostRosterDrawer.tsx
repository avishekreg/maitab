"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dices, MessageCircle, Radio, Wine, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GhostPresence } from "@/lib/cloak/presence";

type Props = {
  open: boolean;
  onClose: () => void;
  ghosts: GhostPresence[];
  selfId: string;
  activeWhisperId: string | null;
  onlineCount: number;
  onWhisper: (ghostId: string) => void;
  onMysteryDrink: (ghostId: string) => void;
  onMysteryMatch: () => void;
  matchCooldownMs?: number;
  busy?: boolean;
};

function statusDot(status: GhostPresence["status"]) {
  if (status === "IN_CONVERSATION") return "bg-amber-400";
  if (status === "AWAY") return "bg-zinc-500";
  return "bg-emerald-400";
}

export function GhostRosterDrawer({
  open,
  onClose,
  ghosts,
  selfId,
  activeWhisperId,
  onlineCount,
  onWhisper,
  onMysteryDrink,
  onMysteryMatch,
  matchCooldownMs = 0,
  busy,
}: Props) {
  const others = ghosts.filter((g) => g.id !== selfId);
  const matchLocked = matchCooldownMs > 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm md:justify-start"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Active lounge ghosts"
        >
          <motion.aside
            initial={{ x: -28, opacity: 0.85 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="flex h-full w-80 flex-col border-r border-zinc-800/80 bg-zinc-950/95 p-5 text-zinc-100 backdrop-blur-2xl md:w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                  <Radio className="h-3.5 w-3.5" aria-hidden />
                  Active Lounge Ghosts
                </p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  {onlineCount} Online
                </p>
              </div>
              <button
                type="button"
                aria-label="Close roster"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-zinc-700 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
                <p className="text-[11px] font-bold text-violet-100">
                  1 · Choose
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                  Tap Whisper on any ghost below
                </p>
              </div>
              <button
                type="button"
                disabled={busy || matchLocked}
                onClick={onMysteryMatch}
                className="cursor-pointer rounded-2xl border border-fuchsia-500/45 bg-gradient-to-r from-fuchsia-600/30 to-violet-600/25 px-3 py-2.5 text-left transition hover:border-fuchsia-400/70 active:scale-[0.98] disabled:opacity-45"
              >
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-fuchsia-100">
                  <Dices className="h-3.5 w-3.5" aria-hidden />
                  2 ·{" "}
                  {matchLocked
                    ? `Match ${Math.ceil(matchCooldownMs / 1000)}s`
                    : "Surprise"}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                  Random live Mystery Match
                </p>
              </button>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              Online ghosts · aliases only · no tables · no phones
            </p>

            <ul className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {others.length === 0 ? (
                <li className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
                  Waiting for other ghosts to materialize…
                </li>
              ) : (
                others.map((g) => {
                  const active = activeWhisperId === g.id;
                  return (
                    <li
                      key={g.id}
                      className={cn(
                        "rounded-2xl border bg-zinc-900/70 p-3 transition",
                        active
                          ? "border-violet-500/50 shadow-[0_0_24px_rgba(139,92,246,0.15)]"
                          : "border-zinc-800/90"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative shrink-0">
                          <span
                            className="grid h-11 w-11 place-items-center rounded-full border-2 text-base"
                            style={{
                              color: g.accent,
                              borderColor: g.accent,
                              boxShadow: `0 0 16px ${g.accent}55`,
                            }}
                            title={g.avatarSeed}
                          >
                            {g.glyph}
                          </span>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950",
                              statusDot(g.status)
                            )}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {g.alias}
                          </p>
                          <p className="truncate font-mono text-xs text-violet-400">
                            {g.vibeTag}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                            {g.status === "IN_CONVERSATION"
                              ? "In conversation"
                              : g.status === "AWAY"
                                ? "Away"
                                : "Online"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onWhisper(g.id)}
                          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-2 py-2 text-[11px] font-bold text-violet-100 transition hover:bg-violet-500/25 active:scale-[0.98]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                          Whisper
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onMysteryDrink(g.id)}
                          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2 py-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-500/25 active:scale-[0.98] disabled:opacity-40"
                        >
                          <Wine className="h-3.5 w-3.5" aria-hidden />
                          Mystery Drink
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Persistent glowing badge — opens the roster drawer. */
export function ActiveGuestsBadge({
  onlineCount,
  onClick,
}: {
  onlineCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-violet-500/40 bg-zinc-950/90 px-3.5 py-2 text-xs font-semibold text-zinc-100 shadow-[0_0_20px_rgba(139,92,246,0.25)] transition hover:border-violet-400/70 hover:shadow-[0_0_28px_rgba(139,92,246,0.4)] active:scale-[0.98]"
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/20 via-transparent to-cyan-500/15 opacity-80" />
      <span className="relative text-base leading-none" aria-hidden>
        🎭
      </span>
      <span className="relative">
        Active Guests:{" "}
        <span className="font-bold text-emerald-300">{onlineCount} Online</span>
      </span>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
    </button>
  );
}
