"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { triggerHaptic } from "@/lib/utils";

interface RouletteWheelProps {
  outcomes: string[];
  spinning: boolean;
  onComplete: (outcome: string) => void;
}

export function ShotRouletteEngine({
  outcomes,
  spinning,
  onComplete,
}: RouletteWheelProps) {
  const controls = useAnimation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number }>>(
    []
  );
  const segments = useMemo(
    () => (outcomes.length ? outcomes : ["Safe", "Shot"]),
    [outcomes]
  );

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!spinning) return;
    void triggerHaptic([20, 30, 20, 30, 40]);

    const index = Math.floor(Math.random() * segments.length);
    const slice = 360 / segments.length;
    const target = 360 * 6 + (360 - (index * slice + slice / 2));

    void controls
      .start({
        rotate: target,
        transition: { duration: 3.6, ease: [0.12, 0.8, 0.12, 1] },
      })
      .then(() => {
        setSparks(
          Array.from({ length: 14 }, (_, i) => ({
            id: i,
            x: 40 + Math.random() * 20,
            y: 20 + Math.random() * 30,
          }))
        );
        void triggerHaptic([80, 40, 120]);
        onCompleteRef.current(segments[index]!);
        window.setTimeout(() => setSparks([]), 900);
      });
  }, [spinning, controls, segments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const slice = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, size, size);
    segments.forEach((label, i) => {
      const start = i * slice - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#C4B5FD" : "#A7F3D0";
      if (label.toLowerCase().includes("shot")) ctx.fillStyle = "#F9A8D4";
      if (label.toLowerCase().includes("safe")) ctx.fillStyle = "#6EE7B7";
      ctx.fill();
      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.fillStyle = "#0F172A";
      ctx.font = "600 11px DM Sans, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(label.slice(0, 12), radius - 14, 4);
      ctx.restore();
    });
  }, [segments]);

  return (
    <div className="relative mx-auto grid h-72 w-72 place-items-center">
      <div className="absolute top-1 z-20 h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-accent-gold drop-shadow" />
      <motion.div animate={controls} className="relative">
        <canvas ref={canvasRef} className="rounded-full shadow-glow-violet" />
      </motion.div>
      {sparks.map((spark) => (
        <motion.span
          key={spark.id}
          className="pointer-events-none absolute h-2 w-2 rounded-full bg-accent-gold"
          style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 0.2 }}
          transition={{ duration: 0.8 }}
        />
      ))}
    </div>
  );
}
