"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { triggerHaptic } from "@/lib/utils";

interface NeonWheelProps {
  labels: string[];
  spinning: boolean;
  onComplete: (label: string) => void;
  accent?: string;
}

export function NeonSpinWheel({
  labels,
  spinning,
  onComplete,
  accent = "#7C3AED",
}: NeonWheelProps) {
  const controls = useAnimation();
  const items = useMemo(
    () => (labels.length ? labels : ["Play on"]),
    [labels]
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!spinning) return;
    void triggerHaptic([15, 25, 15, 25, 15]);
    const index = Math.floor(Math.random() * items.length);
    const slice = 360 / items.length;
    const target = 360 * 5 + (360 - (index * slice + slice / 2));

    void controls
      .start({
        rotate: target,
        transition: { duration: 2.8, ease: [0.15, 0.85, 0.1, 1] },
      })
      .then(() => {
        void triggerHaptic([100, 50, 100]);
        onCompleteRef.current(items[index]!);
      });
  }, [spinning, controls, items]);

  return (
    <div className="relative mx-auto h-64 w-64">
      <div className="absolute left-1/2 top-0 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-accent-gold shadow-glow-gold" />
      <motion.div
        animate={controls}
        className="absolute inset-0 overflow-hidden rounded-full border-4 shadow-glow-violet"
        style={{ borderColor: accent }}
      >
        <div
          className="h-full w-full"
          style={{
            background: `conic-gradient(${items
              .map((_, i) => {
                const a = i % 2 === 0 ? accent : "#151018";
                const start = (i / items.length) * 100;
                const end = ((i + 1) / items.length) * 100;
                return `${a} ${start}% ${end}%`;
              })
              .join(", ")})`,
          }}
        />
        {items.map((label, i) => {
          const angle = (360 / items.length) * i + 360 / items.length / 2;
          return (
            <div
              key={`${label}-${i}`}
              className="absolute left-1/2 top-1/2 origin-left text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{
                transform: `rotate(${angle}deg) translate(28px, -50%)`,
                width: "92px",
              }}
            >
              {label.slice(0, 18)}
            </div>
          );
        })}
      </motion.div>
      {spinning ? null : (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0 rgba(124,58,237,0)",
              "0 0 40px rgba(244,63,94,0.45)",
              "0 0 0 rgba(124,58,237,0)",
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
