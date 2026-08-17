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

const PALETTE = ["#1e1b4b", "#0f172a", "#4c1d95", "#164e63", "#3f2a14", "#111827"];

function bezierEase(x: number) {
  // CSS cubic-bezier(0.15, 0.9, 0.2, 1.0)
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
  const deg = ((360 - (rotation % 360)) + 360) % 360;
  return Math.min(count - 1, Math.floor(deg / slice));
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animatingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [rotation, setRotation] = useState(0);
  const [flap, setFlap] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 10 * dpr;
    const slice = (Math.PI * 2) / items.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    items.forEach((label, i) => {
      const start = i * slice - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length]!;
      ctx.fill();
      ctx.strokeStyle = "rgba(253, 230, 138, 0.35)";
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.fillStyle = "#F8FAFC";
      ctx.font = `700 ${11 * dpr}px ui-sans-serif, system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(label.slice(0, 22), radius - 16 * dpr, 4 * dpr);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 18 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "#09090b";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * dpr;
    ctx.stroke();
  }, [accent, items]);

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
    <div className="relative mx-auto grid w-full max-w-sm place-items-center">
      <motion.div
        key={flap}
        className="absolute top-0 z-20 h-0 w-0 border-l-[11px] border-r-[11px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
        animate={{ rotate: flap % 2 === 0 ? -8 : 8 }}
        transition={{ type: "spring", stiffness: 520, damping: 18 }}
      />

      <div
        className="relative rounded-full p-[10px] shadow-[0_0_40px_rgba(245,158,11,0.35)]"
        style={{
          background:
            "conic-gradient(from 0deg, #fde68a, #a78bfa, #22d3ee, #f59e0b, #fde68a)",
        }}
      >
        <div className="rounded-full bg-zinc-950 p-1.5">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="block h-72 w-72 rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "none",
              willChange: "transform",
            }}
          />
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
