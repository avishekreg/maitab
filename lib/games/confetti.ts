/** Lightweight canvas-confetti burst (no extra package). */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  tilt: number;
};

const GOLD = ["#FDE68A", "#F59E0B", "#FBBF24", "#C4B5FD", "#22D3EE", "#FFFFFF"];

export function burstConfetti(durationMs = 2200) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-maitab-confetti", "1");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:1100;pointer-events:none;width:100%;height:100%";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };
  resize();

  const particles: Particle[] = Array.from({ length: 160 }, () => ({
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * 0.15,
    vx: (Math.random() - 0.5) * 14 * dpr,
    vy: (Math.random() * -12 - 4) * dpr,
    size: (4 + Math.random() * 6) * dpr,
    color: GOLD[Math.floor(Math.random() * GOLD.length)]!,
    life: 1,
    tilt: Math.random() * Math.PI,
  }));

  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += 0.28 * dpr;
      p.x += p.vx;
      p.y += p.vy;
      p.tilt += 0.12;
      p.life -= 0.008;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (t < durationMs) {
      frame = requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };
  frame = requestAnimationFrame(tick);
  window.setTimeout(() => {
    cancelAnimationFrame(frame);
    canvas.remove();
  }, durationMs + 200);
}
