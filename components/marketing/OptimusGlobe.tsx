"use client";

import { useEffect, useRef } from "react";

const CHARS = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";

/**
 * Ported from the Optimus v0 hero: spinning ASCII/mesh globe on 2D canvas.
 * `tone="light"` draws luminous dots for overlays on dark club photography.
 */
export function OptimusGlobe({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const shortSide = Math.min(rect.width, rect.height);
      // Cap radius on narrow / short canvases so the mesh stays in-frame on phones
      const radius = shortSide * (shortSide < 360 ? 0.42 : 0.525);
      const fontPx = shortSide < 360 ? 9 : shortSide < 520 ? 10 : 12;
      const step = shortSide < 360 ? 0.22 : 0.15;
      ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const points: Array<{ x: number; y: number; z: number; char: string }> =
        [];

      for (let lon = 0; lon < Math.PI * 2; lon += step) {
        for (let lat = 0; lat < Math.PI; lat += step) {
          const x = Math.sin(lat) * Math.cos(lon + angle * 0.5);
          const y = Math.sin(lat) * Math.sin(lon + angle * 0.5);
          const z = Math.cos(lat);

          const tilt = angle * 0.3;
          const x1 = x * Math.cos(tilt) - z * Math.sin(tilt);
          const z1 = x * Math.sin(tilt) + z * Math.cos(tilt);

          const yaw = angle * 0.2;
          const y1 = y * Math.cos(yaw) - z1 * Math.sin(yaw);
          const z2 = y * Math.sin(yaw) + z1 * Math.cos(yaw);

          const charIndex = Math.floor(((z2 + 1) / 2) * (CHARS.length - 1));
          points.push({
            x: cx + x1 * radius,
            y: cy + y1 * radius,
            z: z2,
            char: CHARS[charIndex] ?? "·",
          });
        }
      }

      points.sort((a, b) => a.z - b.z);
      for (const p of points) {
        const depth = (p.z + 1) * 0.5;
        if (tone === "light") {
          // Neon amethyst → cyan glow for hero mesh
          const alpha = 0.35 + depth * 0.6;
          const r = Math.round(139 + depth * 60);
          const g = Math.round(92 + depth * 120);
          const b = Math.round(246 - depth * 40);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else {
          const alpha = 0.18 + depth * 0.45;
          ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
        }
        ctx.fillText(p.char, p.x, p.y);
      }

      // 50% slower than the original 0.02 step — calm background glide
      angle += 0.01;
      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [tone]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full"}
      style={{ display: "block" }}
      aria-hidden
    />
  );
}
