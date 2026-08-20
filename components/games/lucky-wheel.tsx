"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wheel,
  useWheel,
  type WheelItem,
} from "@cxde/wheel-of-fortune";
import "@cxde/wheel-of-fortune/style.css";
import confetti from "canvas-confetti";
import { sanitizeWheelLabels, houseLuckyLabels } from "@/lib/games/wheel-rewards";
import { playWheelTick, playWinSting } from "@/lib/games/arcade-sfx";
import { cn, triggerHaptic } from "@/lib/utils";

const PALETTE = [
  "#1e1b4b",
  "#4c1d95",
  "#0f172a",
  "#164e63",
  "#3f2a14",
  "#312e81",
  "#134e4a",
  "#111827",
];

function explodeConfetti() {
  const defaults = {
    origin: { y: 0.35 },
    zIndex: 1200,
    disableForReducedMotion: true,
  };
  confetti({
    ...defaults,
    particleCount: 110,
    spread: 70,
    startVelocity: 45,
    colors: ["#FDE68A", "#A78BFA", "#22D3EE", "#F59E0B", "#FFFFFF"],
  });
  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.55 },
    });
    confetti({
      ...defaults,
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.55 },
    });
  }, 180);
}

export function LuckyWheel({
  labels,
  spinning,
  onComplete,
  celebrate = true,
}: {
  labels?: string[];
  spinning: boolean;
  onComplete: (label: string) => void;
  accent?: string;
  celebrate?: boolean;
}) {
  const wheel = useWheel();
  const safeLabels = useMemo(() => {
    // Lucky house spins use the approved reward set; other formats keep
    // their prompts/dares after stripping any discount-like labels.
    const looksLikeHousePrizes =
      !labels?.length ||
      labels.some((l) => /shooter|saarthi|spin again|dj song|table dare/i.test(l));
    return looksLikeHousePrizes
      ? houseLuckyLabels(labels)
      : sanitizeWheelLabels(labels);
  }, [labels]);
  const items = useMemo<WheelItem[]>(
    () =>
      safeLabels.map((label, i) => ({
        id: `seg-${i}-${label.slice(0, 12)}`,
        label,
        weight: 1,
        color: PALETTE[i % PALETTE.length],
        text: {
          color: "#ffffff",
          overflow: "shrink-wrap",
          maxLines: 3,
          minFontSize: 1.6,
          fontWeight: 700,
          radius: 0.62,
          innerRadius: 0.28,
          strokeColor: "#09090b",
          strokeWidth: 0.35,
        },
      })),
    [safeLabels]
  );

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const celebrateRef = useRef(celebrate);
  celebrateRef.current = celebrate;
  const spinningLock = useRef(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!spinning || spinningLock.current) return;
    spinningLock.current = true;
    setWinner(null);
    void triggerHaptic([12, 18, 12, 18]);
    void wheel.spin({ mode: "client" }).finally(() => {
      spinningLock.current = false;
    });
  }, [spinning, wheel]);

  return (
    <div className="relative mx-auto w-full max-w-[min(22rem,calc(100vw-4rem))] px-2">
      <div className="relative rounded-full p-3 shadow-[0_0_48px_rgba(245,158,11,0.35)]">
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background:
              "conic-gradient(from 0deg, #fde68a, #e5e7eb, #a78bfa, #22d3ee, #f59e0b, #fde68a)",
          }}
        />
        <div className="relative overflow-hidden rounded-full bg-zinc-950 p-2">
          <Wheel
            controller={wheel}
            items={items}
            size="100%"
            pointerPosition="top"
            ariaLabel="House prize wheel"
            spinAnimation={{
              duration: 4800 + Math.floor(Math.random() * 700),
              rotations: { min: 5, max: 8 },
              easing: "cubic-bezier(0.12, 0.8, 0.33, 1)",
            }}
            idleAnimation={{
              enabled: true,
              duration: 3200,
              rotation: 0.6,
              scale: 1.01,
              easing: "ease-in-out",
            }}
            theme={{
              background: "#09090b",
              border: { color: "#fde68a", width: 2.2 },
              dividers: { color: "rgba(253,230,138,0.35)", width: 1 },
              text: {
                color: "#ffffff",
                fontWeight: 700,
                overflow: "shrink-wrap",
                maxLines: 3,
                radius: 0.6,
              },
            }}
            onSectorPass={() => {
              playWheelTick();
              void triggerHaptic(6);
            }}
            onSpinEnd={({ winner: w }) => {
              const label = w?.label ?? safeLabels[0] ?? "Spin Again";
              // Hard block: never complete with a discount-style label
              const safe = sanitizeWheelLabels([label])[0] ?? "Spin Again";
              playWinSting();
              void triggerHaptic([80, 40, 120]);
              if (celebrateRef.current) {
                explodeConfetti();
                setWinner(safe);
              }
              onCompleteRef.current(safe);
              spinningLock.current = false;
            }}
          />
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Canvas inertia wheel · no bill discounts
      </p>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {winner ? (
                <motion.div
                  key="cxde-win"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[999] grid place-items-center bg-black/80 px-4 backdrop-blur-md"
                  onClick={() => setWinner(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 16 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative z-[1000] w-full max-w-sm rounded-3xl border border-amber-300/40 bg-zinc-950 p-8 text-center shadow-[0_0_80px_rgba(245,158,11,0.45)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">
                      House hits
                    </p>
                    <h3 className="mt-3 font-display text-3xl font-black text-white">
                      {winner}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setWinner(null)}
                      className={cn(
                        "mt-6 w-full cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white active:scale-[0.98]"
                      )}
                    >
                      Pocket it
                    </button>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}

export default LuckyWheel;
