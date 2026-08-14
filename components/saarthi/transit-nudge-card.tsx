"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_CLUB } from "@/lib/demo/data";
import { useSaarthiBooking } from "@/components/saarthi/SaarthiProvider";

export function TransitNudgeCard({
  venueName = DEMO_CLUB.name,
}: {
  venueName?: string;
}) {
  const saarthi = useSaarthiBooking();
  const [phase, setPhase] = useState<"ask" | "safe" | "hidden">("ask");

  if (phase === "hidden") return null;

  return (
    <AnimatePresence mode="wait">
      {phase === "safe" ? (
        <motion.p
          key="safe"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100"
        >
          Have a safe journey home!
        </motion.p>
      ) : (
        <motion.aside
          key="nudge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="rounded-2xl border border-cyan-500/30 bg-zinc-950/90 p-5 shadow-[0_0_25px_rgba(6,182,212,0.12)] backdrop-blur-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
            🍸 VIP Transit Concierge
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">
            Wrapping up tonight at {venueName}? We want to ensure you and your
            wheels reach home safely.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
            Are you self-driving tonight?
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setPhase("safe");
                window.setTimeout(() => setPhase("hidden"), 2400);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              I Have a Driver / Taking a Cab
            </button>
            <button
              type="button"
              onClick={() =>
                saarthi?.openBooking({
                  carDetails: `Guest vehicle at ${venueName} valet`,
                })
              }
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3 text-xs font-semibold text-zinc-950"
            >
              🚗 Book mAI Saarthi Chauffeur
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
