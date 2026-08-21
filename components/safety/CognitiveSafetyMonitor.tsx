"use client";

import { useEffect, useState } from "react";
import { useSaarthiBooking } from "@/components/saarthi/SaarthiProvider";
import {
  computeCognitiveSnapshot,
  recordKeystroke,
  recordTap,
  shouldNudgeMaiSaarthi,
  type CognitiveSnapshot,
} from "@/lib/safety/cognitive-signals";
import { SAARTHI_BRAND } from "@/lib/saarthi/types";

/**
 * Observes typing / tap hygiene on the guest shell.
 * When risk is elevated, offers a non-blocking mAISaarthi nudge.
 */
export function CognitiveSafetyMonitor() {
  const saarthi = useSaarthiBooking();
  const [snap, setSnap] = useState<CognitiveSnapshot | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isBs =
        e.key === "Backspace" || e.key === "Delete" || e.code === "Backspace";
      recordKeystroke(isBs);
      setSnap(computeCognitiveSnapshot());
    };

    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const mis =
        !target ||
        target === document.body ||
        target === document.documentElement ||
        Boolean(target.closest("[data-dead-zone]"));
      recordTap(mis);
      setSnap(computeCognitiveSnapshot());
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  if (!snap || dismissed || !shouldNudgeMaiSaarthi(snap)) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-cyan-500/40 bg-zinc-950/95 p-4 shadow-[0_12px_40px_rgba(6,182,212,0.25)] backdrop-blur-xl sm:inset-x-auto sm:right-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
        Responsible night check
      </p>
      <p className="mt-2 text-sm text-zinc-200">
        Your recent taps and typing look a bit unsteady. Want a verified{" "}
        {SAARTHI_BRAND} chauffeur so nobody drives home impaired?
      </p>
      {snap.reasons[0] ? (
        <p className="mt-1 text-[11px] text-zinc-500">Signal: {snap.reasons[0]}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            saarthi?.openBooking();
            setDismissed(true);
          }}
          className="flex-1 rounded-xl bg-cyan-500 px-3 py-2.5 text-xs font-bold text-zinc-950"
        >
          Book {SAARTHI_BRAND}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-xl border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default CognitiveSafetyMonitor;
