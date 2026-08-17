"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { burstConfetti } from "@/lib/games/confetti";
import { LUCKY_WHEEL_SEGMENTS } from "@/lib/games/arcade-expansion";
import { playWheelTick, playWinSting } from "@/lib/games/arcade-sfx";
import { cn, triggerHaptic } from "@/lib/utils";

const DURATION_MS = 4500;
const EXTRA_TURNS = 6;
const SIZE = 288;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RIM = SIZE / 2 - 8;
const TEXT_R = RIM * 0.58;
const HUB_R = 22;

const PALETTE = ["#1e1b4b", "#0f172a", "#4c1d95", "#164e63", "#3f2a14", "#111827"];

function bezierEase(x: number) {
  const x1 = 0.15;
  const y1 = 0.9;
  const x2 = 0.2;
  const y2 = 1;
  let t = x;
  for (let i = 0; i < 10; i++) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const xt = ((ax * t + bx) * t + cx) * t;
    const dxt = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(dxt) < 1e-6) break;
    t = Math.max(0, Math.min(1, t - (xt - x) / dxt));
  }
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return ((ay * t + by) * t + cy) * t;
}

function pointerIndex(rotation: number, count: number) {
  const slice = 360 / count;
  const deg = (((360 - (rotation % 360)) % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(deg / slice));
}

function slicePath(index: number, count: number) {
  const slice = (Math.PI * 2) / count;
  const start = index * slice - Math.PI / 2;
  const end = start + slice;
  const x1 = CX + RIM * Math.cos(start);
  const y1 = CY + RIM * Math.sin(start);
  const x2 = CX + RIM * Math.cos(end);
  const y2 = CY + RIM * Math.sin(end);
  const large = slice > Math.PI ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${RIM} ${RIM} 0 ${large} 1 ${x2} ${y2} Z`;
}

function splitSliceLabel(raw: string): [string] | [string, string] {
  const clipped = raw.length > 24 ? `${raw.slice(0, 21).trimEnd()}...` : raw;
  if (clipped.length <= 12) return [clipped];
  const cut = clipped.lastIndexOf(" ", 12);
  const at = cut >= 5 ? cut : 12;
  const a = clipped.slice(0, at).trim();
  const b = clipped.slice(at).trim();
  return b ? [a, b] : [a];
}

export function LuckyWheel({
  labels,
  spinning,
  onComplete,
  accent = "#C4B5FD",
  celebrate = true,
}: {
  labels?: string[];
  spinning: boolean;
  onComplete: (label: string) => void;
  accent?: string;
  celebrate?: boolean;
}) {
  const items = useMemo(
    () => (labels?.length ? labels : [...LUCKY_WHEEL_SEGMENTS]),
    [labels]
  );
  const rotationRef = useRef(0);
  const animatingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [rotation, setRotation] = useState(0);
  const [flap, setFlap] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const sliceDeg = 360 / items.length;

  useEffect(() => {
    if (!spinning || animatingRef.current) return;
    animatingRef.current = true;
    setWinner(null);
    void triggerHaptic([12, 18, 12, 18, 12]);

    const count = items.length;
    const slice = 360 / count;
    const index = Math.floor(Math.random() * count);
    const from = rotationRef.current;
    const currentMod = ((from % 360) + 360) % 360;
    const desiredMod = (360 - (index * slice + slice / 2) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    const to = from + EXTRA_TURNS * 360 + delta;

    const start = performance.now();
    let lastTick = pointerIndex(from, count);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = bezierEase(t);
      const next = from + (to - from) * eased;
      rotationRef.current = next;
      setRotation(next);

      const tickAt = pointerIndex(next, count);
      if (tickAt !== lastTick) {
        lastTick = tickAt;
        playWheelTick();
        setFlap((n) => n + 1);
        void triggerHaptic(8);
      }

      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }

      rotationRef.current = to;
      setRotation(to);
      animatingRef.current = false;
      const label = items[index]!;
      playWinSting();
      void triggerHaptic([80, 40, 120]);
      if (celebrate) {
        burstConfetti();
        setWinner(label);
      }
      onCompleteRef.current(label);
    };

    requestAnimationFrame(step);
  }, [celebrate, items, spinning]);

  return (
    <div className="relative mx-auto grid w-full max-w-full place-items-center overflow-hidden px-2">
      <motion.div
        key={flap}
        className="absolute top-0 z-20 h-0 w-0 border-l-[11px] border-r-[11px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
        animate={{ rotate: flap % 2 === 0 ? -8 : 8 }}
        transition={{ type: "spring", stiffness: 520, damping: 18 }}
      />

      <div
        className="relative w-full max-w-[min(18rem,calc(100vw-5.5rem))] rounded-full p-[10px] shadow-[0_0_40px_rgba(245,158,11,0.35)]"
        style={{
          background:
            "conic-gradient(from 0deg, #fde68a, #a78bfa, #22d3ee, #f59e0b, #fde68a)",
        }}
      >
        <div className="overflow-hidden rounded-full bg-zinc-950 p-1.5">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="block h-auto w-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "none",
              willChange: "transform",
            }}
          >
            {items.map((label, i) => {
              const angle = (i + 0.5) * sliceDeg;
              const lines = splitSliceLabel(label);
              return (
                <g key={`${label}-${i}`}>
                  <path
                    d={slicePath(i, items.length)}
                    fill={PALETTE[i % PALETTE.length]}
                    stroke="rgba(253, 230, 138, 0.35)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={CX}
                    y={CY - TEXT_R}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                    transform={`rotate(${angle} ${CX} ${CY})`}
                  >
                    {lines.length === 1 ? (
                      lines[0]
                    ) : (
                      <>
                        <tspan x={CX} dy="-0.6em">
                          {lines[0]}
                        </tspan>
                        <tspan x={CX} dy="1.2em">
                          {lines[1]}
                        </tspan>
                      </>
                    )}
                  </text>
                </g>
              );
            })}
            <circle
              cx={CX}
              cy={CY}
              r={HUB_R}
              fill="#09090b"
              stroke={accent}
              strokeWidth="3"
            />
          </svg>
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Metallic inertia wheel
      </p>

      <AnimatePresence>
        {winner ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4 backdrop-blur-md"
            onClick={() => setWinner(null)}
          >
            <motion.div
              initial={{ scale: 0.86, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border border-amber-300/40 bg-zinc-950 p-8 text-center shadow-[0_0_80px_rgba(245,158,11,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">
                House hits
              </p>
              <h3 className="mt-3 font-display text-3xl font-black tracking-tight text-white">
                {winner}
              </h3>
              <button
                type="button"
                onClick={() => setWinner(null)}
                className={cn(
                  "mt-6 w-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30"
                )}
              >
                Pocket it
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default LuckyWheel;
