"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playFlip, playWinSting } from "@/lib/games/arcade-sfx";
import { burstConfetti } from "@/lib/games/confetti";
import { cn, triggerHaptic } from "@/lib/utils";

const CARD =
  "rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl";

function PlayButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function TruthOrTabEngine({
  prompts,
  seconds = 15,
  onComplete,
}: {
  prompts: string[];
  seconds?: number;
  onComplete: (label: string) => void;
}) {
  const [prompt, setPrompt] = useState(prompts[0] ?? "Truth or Tab?");
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      playWinSting();
      onComplete(prompt);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, onComplete, prompt, running]);

  return (
    <div className={CARD}>
      <div className="flex min-h-[140px] w-full flex-col justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-lg md:p-8">
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          Truth or Tab · {left}s
        </p>
        <h3 className="text-left font-display text-lg font-extrabold leading-relaxed text-white md:text-xl">
          {prompt}
        </h3>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-violet-500 transition-all duration-1000"
          style={{ width: `${(left / seconds) * 100}%` }}
        />
      </div>
      <PlayButton
        onClick={() => {
          const next =
            prompts[Math.floor(Math.random() * prompts.length)] ?? prompt;
          setPrompt(next);
          setLeft(seconds);
          setRunning(true);
          void triggerHaptic(20);
        }}
      >
        {running ? "Hold the heat…" : "Deal a spicy prompt"}
      </PlayButton>
    </div>
  );
}

const KINGS: { rank: string; rule: string }[] = [
  { rank: "A", rule: "Waterfall — drink until the dealer stops." },
  { rank: "K", rule: "King's Cup — pour into the communal vessel." },
  { rank: "Q", rule: "Question master until the next Queen." },
  { rank: "J", rule: "Make a rule. Break it, drink." },
  { rank: "10", rule: "Category — name drinks until someone stalls." },
  { rank: "7", rule: "Heaven — last hands up drinks." },
];

export function KingsCupEngine({ onComplete }: { onComplete: (label: string) => void }) {
  const [card, setCard] = useState<(typeof KINGS)[number] | null>(null);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-violet-300">
        King&apos;s Cup digital deck
      </p>
      <button
        type="button"
        onClick={() => {
          const next = KINGS[Math.floor(Math.random() * KINGS.length)]!;
          setCard(next);
          setFlipped(true);
          playFlip();
          void triggerHaptic(30);
          onComplete(`${next.rank} — ${next.rule}`);
        }}
        className="perspective-game mx-auto mt-5 block h-48 w-36"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55 }}
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-700 to-zinc-950"
            style={{ backfaceVisibility: "hidden" }}
          />
          <div
            className="absolute inset-0 grid place-items-center rounded-2xl border border-amber-300/50 bg-zinc-900 px-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div>
              <p className="font-display text-4xl font-black text-amber-300">
                {card?.rank ?? "?"}
              </p>
              <p className="mt-2 text-xs text-zinc-300">{card?.rule}</p>
            </div>
          </div>
        </motion.div>
      </button>
      <p className="mt-4 text-sm text-zinc-400">Tap the deck to flip.</p>
    </div>
  );
}

export function ReactionPourEngine({
  onComplete,
}: {
  onComplete: (label: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "done">("idle");
  const [ms, setMs] = useState<number | null>(null);
  const goAt = useRef(0);

  function arm() {
    setPhase("wait");
    setMs(null);
    window.setTimeout(() => {
      setPhase("go");
      goAt.current = performance.now();
      void triggerHaptic(10);
    }, 900 + Math.random() * 1800);
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (phase === "idle") {
          arm();
          return;
        }
        if (phase === "wait") {
          setPhase("idle");
          onComplete("False start — pour the round");
          return;
        }
        if (phase === "go") {
          const score = Math.round(performance.now() - goAt.current);
          setMs(score);
          setPhase("done");
          playWinSting();
          onComplete(`${score}ms pour reflex`);
        }
      }}
      className={cn(
        CARD,
        "min-h-[220px] w-full text-center transition-colors",
        phase === "go" && "border-emerald-400 bg-emerald-500 text-zinc-950",
        phase === "wait" && "border-rose-500/40"
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider">
        Reaction pour
      </p>
      <p className="mt-6 font-display text-3xl font-black">
        {phase === "idle" && "Tap to arm"}
        {phase === "wait" && "Wait for green…"}
        {phase === "go" && "POUR"}
        {phase === "done" && `${ms} ms`}
      </p>
    </button>
  );
}

export function NeonBarRunner({ onComplete }: { onComplete: (label: string) => void }) {
  const [y, setY] = useState(0);
  const [ox, setOx] = useState(240);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const vel = useRef(0);

  useEffect(() => {
    if (dead) return;
    let frame = 0;
    const loop = () => {
      vel.current -= 0.6;
      setY((prev) => {
        const next = Math.max(0, prev + vel.current);
        if (next === 0) vel.current = 0;
        return next;
      });
      setOx((x) => {
        const nx = x - 5;
        if (nx < -16) {
          setScore((s) => s + 1);
          return 230 + Math.random() * 50;
        }
        return nx;
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [dead]);

  useEffect(() => {
    if (dead) return;
    if (ox < 54 && ox > 22 && y < 26) {
      setDead(true);
      onComplete(`Bar runner · ${score} bottles cleared`);
    }
  }, [dead, onComplete, ox, score, y]);

  return (
    <button
      type="button"
      onClick={() => {
        if (dead) {
          setDead(false);
          setScore(0);
          setOx(240);
          setY(0);
          vel.current = 0;
          return;
        }
        vel.current = 9.5;
        void triggerHaptic(8);
      }}
      className={cn(CARD, "relative h-52 overflow-hidden text-left")}
    >
      <p className="font-mono text-[11px] text-cyan-300">Neon Bar Runner · {score}</p>
      <div
        className="absolute bottom-8 left-8 h-8 w-8 rounded-md bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.8)]"
        style={{ transform: `translateY(${-y}px)` }}
      />
      <div
        className="absolute bottom-8 h-10 w-4 rounded-sm bg-amber-400"
        style={{ left: ox }}
      />
      <div className="absolute inset-x-0 bottom-6 h-px bg-zinc-700" />
      <p className="absolute bottom-2 text-[11px] text-zinc-500">
        {dead ? "Tap to retry" : "Tap to jump"}
      </p>
    </button>
  );
}

export function CocktailShakerEngine({
  onComplete,
}: {
  onComplete: (label: string) => void;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      if (mag > 22) setCount((n) => n + 1);
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  useEffect(() => {
    if (count >= 40 && !done) {
      setDone(true);
      burstConfetti(1400);
      playWinSting();
      onComplete("Shaker locked — cocktail upsell");
    }
  }, [count, done, onComplete]);

  return (
    <button
      type="button"
      onClick={() => {
        setCount((n) => n + 2);
        void triggerHaptic(6);
      }}
      className={cn(CARD, "text-center")}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
        Shake or tap-mash
      </p>
      <p className="mt-4 font-display text-5xl font-black text-white">{count}</p>
      <p className="mt-2 text-sm text-zinc-400">Hit 40 shakes to lock the pour.</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-cyan-400"
          style={{ width: `${Math.min(100, (count / 40) * 100)}%` }}
        />
      </div>
    </button>
  );
}

export function WhoPaysEngine({ onComplete }: { onComplete: (label: string) => void }) {
  const [fingers, setFingers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-violet-300">
        Who pays the round?
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        Everyone plants a finger. House lightning picks the tab.
      </p>
      <div
        className="relative mt-4 grid h-44 place-items-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
        onClick={() => setFingers((f) => [...f, f.length + 1])}
      >
        {fingers.map((id) => (
          <motion.span
            key={id}
            className={cn(
              "absolute h-12 w-12 rounded-full border-2 border-cyan-300 bg-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.6)]",
              picked === id && "border-amber-300 bg-amber-400/40"
            )}
            style={{
              left: `${18 + (id * 17) % 70}%`,
              top: `${20 + (id * 13) % 50}%`,
            }}
            animate={
              picked === id
                ? { scale: [1, 1.3, 1], boxShadow: "0 0 40px rgba(251,191,36,0.9)" }
                : { scale: [1, 1.08, 1] }
            }
            transition={{ repeat: Infinity, duration: 0.9 }}
          />
        ))}
        <p className="text-xs text-zinc-500">Tap to add a finger</p>
      </div>
      <PlayButton
        disabled={fingers.length < 2}
        onClick={() => {
          const id = fingers[Math.floor(Math.random() * fingers.length)]!;
          setPicked(id);
          playWinSting();
          burstConfetti(1200);
          onComplete(`Finger ${id} pays the round`);
        }}
      >
        Strike lightning
      </PlayButton>
    </div>
  );
}

export function TableTriviaEngine({
  questions,
  onComplete,
}: {
  questions: { q: string; options: string[]; a: number }[];
  onComplete: (label: string) => void;
}) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const q = questions[i];

  if (!q) {
    return (
      <div className={CARD}>
        <p className="font-display text-2xl font-black text-white">
          Table score {score}/{questions.length}
        </p>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] text-cyan-300">
        Trivia clash · Q{i + 1}
      </p>
      <h3 className="mt-3 font-display text-xl font-black text-white">{q.q}</h3>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, idx) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              const ok = idx === q.a;
              const nextScore = score + (ok ? 1 : 0);
              setScore(nextScore);
              if (i + 1 >= questions.length) {
                playWinSting();
                onComplete(`Trivia ${nextScore}/${questions.length}`);
              }
              setI((n) => n + 1);
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-100 hover:border-violet-400"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AvPollEngine({
  options,
  onComplete,
}: {
  options: string[];
  onComplete: (label: string) => void;
}) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
        AV billboard DJ poll
      </p>
      <div className="mt-4 space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              setVotes((v) => ({ ...v, [opt]: (v[opt] ?? 0) + 1 }));
              onComplete(`AV drop · ${opt}`);
              void triggerHaptic(20);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white hover:border-amber-300"
          >
            <span>{opt}</span>
            <span className="font-mono text-xs text-zinc-400">{votes[opt] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScratchWinEngine({ onComplete }: { onComplete: (label: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prize = useMemo(
    () =>
      ["Free Craft Shooter", "VIP Fast-Pass", "Saarthi ₹200", "15% off bill"][
        Math.floor(Math.random() * 4)
      ]!,
    []
  );
  const revealed = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 180;
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(0, 0, 320, 180);
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 16px ui-sans-serif";
    ctx.fillText("SCRATCH", 118, 96);

    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      const data = ctx.getImageData(0, 0, 320, 180).data;
      let clear = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 40) clear += 1;
      if (!revealed.current && clear / (320 * 180) > 0.45) {
        revealed.current = true;
        burstConfetti(1400);
        playWinSting();
        onComplete(prize);
      }
    };

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      scratch(
        ((e.clientX - r.left) / r.width) * 320,
        ((e.clientY - r.top) / r.height) * 180
      );
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", move);
    return () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", move);
    };
  }, [onComplete, prize]);

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] text-amber-300">Golden scratch card</p>
      <div className="relative mx-auto mt-4 w-full max-w-full">
        <div className="absolute inset-0 grid place-items-center font-display text-xl font-black text-amber-200">
          {prize}
        </div>
        <canvas ref={canvasRef} className="relative h-[180px] w-full touch-none rounded-2xl" />
      </div>
    </div>
  );
}

export function MysteryVaultEngine({ onComplete }: { onComplete: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <div
      className={CARD + " text-center"}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((e.clientX - r.left) / r.width - 0.5) * 18,
          y: ((e.clientY - r.top) / r.height - 0.5) * -18,
        });
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
        Mystery vault
      </p>
      <motion.button
        type="button"
        style={{ rotateX: tilt.y, rotateY: tilt.x, transformStyle: "preserve-3d" }}
        onClick={() => {
          setOpen(true);
          burstConfetti();
          playWinSting();
          onComplete("Vault jackpot — bottle service upsell");
        }}
        className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-200/20 to-zinc-950 shadow-[0_20px_60px_rgba(245,158,11,0.25)]"
      >
        <span className="font-display text-4xl">{open ? "✦" : "▣"}</span>
      </motion.button>
      <p className="mt-4 text-sm text-zinc-400">Tilt the lid. Tap to crack it.</p>
    </div>
  );
}

export function SobrietyReflexEngine({
  onComplete,
}: {
  onComplete: (label: string) => void;
}) {
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [go, setGo] = useState(false);
  const start = useRef(0);

  function arm() {
    setGo(false);
    window.setTimeout(() => {
      setGo(true);
      start.current = performance.now();
    }, 700 + Math.random() * 1400);
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!go && round === 0 && times.length === 0) {
          arm();
          return;
        }
        if (!go) return;
        const ms = Math.round(performance.now() - start.current);
        const next = [...times, ms];
        setTimes(next);
        setGo(false);
        if (next.length >= 3) {
          const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
          playWinSting();
          onComplete(
            avg < 320
              ? `Saarthi perk unlocked · ${avg}ms avg`
              : `Book Saarthi anyway · ${avg}ms avg`
          );
        } else {
          setRound((n) => n + 1);
          arm();
        }
      }}
      className={cn(CARD, "min-h-[220px]", go && "border-cyan-400 bg-cyan-500 text-zinc-950")}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider">
        Saarthi safe-ride · round {Math.min(times.length + 1, 3)}/3
      </p>
      <p className="mt-6 font-display text-3xl font-black">
        {go ? "TAP" : times.length >= 3 ? "Perk resolved" : "Wait for cyan"}
      </p>
    </button>
  );
}

export function DiceDuelEngine({
  target = 8,
  onComplete,
}: {
  target?: number;
  onComplete: (label: string) => void;
}) {
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [rolling, setRolling] = useState(false);

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
        Dice duel · beat {target}
      </p>
      <div className="mt-6 flex items-center justify-center gap-4">
        {(dice ?? [0, 0]).map((n, i) => (
          <motion.div
            key={i}
            animate={rolling ? { rotate: [0, 18, -12, 0], scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.35, repeat: rolling ? 3 : 0 }}
            className="grid h-20 w-20 place-items-center rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-700/40 to-zinc-950 font-display text-3xl font-black text-white shadow-[0_0_24px_rgba(124,58,237,0.25)]"
          >
            {dice ? n : "?"}
          </motion.div>
        ))}
      </div>
      <PlayButton
        disabled={rolling}
        onClick={() => {
          setRolling(true);
          void triggerHaptic(25);
          window.setTimeout(() => {
            const next: [number, number] = [
              1 + Math.floor(Math.random() * 6),
              1 + Math.floor(Math.random() * 6),
            ];
            setDice(next);
            setRolling(false);
            const sum = next[0] + next[1];
            playWinSting();
            onComplete(
              sum >= target
                ? `High roll ${sum} — table immunity`
                : `Rolled ${sum} — loser buys`
            );
          }, 700);
        }}
      >
        {rolling ? "Rolling…" : "Roll the table dice"}
      </PlayButton>
    </div>
  );
}

export function HotSeatEngine({
  prompts,
  seconds = 20,
  onComplete,
}: {
  prompts: string[];
  seconds?: number;
  onComplete: (label: string) => void;
}) {
  const [prompt, setPrompt] = useState(prompts[0] ?? "Take the hot seat.");
  const [left, setLeft] = useState(seconds);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!live) return;
    if (left <= 0) {
      setLive(false);
      playWinSting();
      onComplete(prompt);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, live, onComplete, prompt]);

  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-rose-300">
        Hot seat · {left}s
      </p>
      <h3 className="mt-4 font-display text-xl font-black leading-snug text-white">
        {prompt}
      </h3>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-1000"
          style={{ width: `${(left / seconds) * 100}%` }}
        />
      </div>
      <PlayButton
        onClick={() => {
          const next =
            prompts[Math.floor(Math.random() * prompts.length)] ?? prompt;
          setPrompt(next);
          setLeft(seconds);
          setLive(true);
          void triggerHaptic(20);
        }}
      >
        {live ? "Stay in the seat…" : "Put someone on the seat"}
      </PlayButton>
    </div>
  );
}

const FLASH_COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#e11d48"] as const;

export function MemoryFlashEngine({
  levels = 4,
  onComplete,
}: {
  levels?: number;
  onComplete: (label: string) => void;
}) {
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "show" | "play" | "done">("idle");

  async function playSequence(next: number[]) {
    setPhase("show");
    for (const idx of next) {
      setLit(idx);
      await new Promise((r) => setTimeout(r, 420));
      setLit(null);
      await new Promise((r) => setTimeout(r, 160));
    }
    setPhase("play");
  }

  function start() {
    const next = Array.from({ length: levels }, () =>
      Math.floor(Math.random() * FLASH_COLORS.length)
    );
    setSeq(next);
    setInput([]);
    void playSequence(next);
  }

  function tap(i: number) {
    if (phase !== "play") return;
    const next = [...input, i];
    setInput(next);
    void triggerHaptic(12);
    const ok = next.every((v, idx) => v === seq[idx]);
    if (!ok) {
      setPhase("done");
      onComplete(`Memory miss · ${next.length - 1}/${seq.length}`);
      return;
    }
    if (next.length === seq.length) {
      setPhase("done");
      playWinSting();
      burstConfetti(900);
      onComplete(`Memory clear · ${seq.length} flashes`);
    }
  }

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
        Memory flash · {levels} hits
      </p>
      <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-3">
        {FLASH_COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => tap(i)}
            className="h-16 rounded-2xl border border-white/10 transition-transform active:scale-95"
            style={{
              background: lit === i ? c : `${c}55`,
              boxShadow: lit === i ? `0 0 28px ${c}` : undefined,
            }}
            aria-label={`Pad ${i + 1}`}
          />
        ))}
      </div>
      <PlayButton disabled={phase === "show"} onClick={start}>
        {phase === "idle" || phase === "done" ? "Start sequence" : "Watch… then repeat"}
      </PlayButton>
    </div>
  );
}

export function BeatTapEngine({
  taps = 10,
  onComplete,
}: {
  taps?: number;
  onComplete: (label: string) => void;
}) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const started = useRef(0);

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-violet-300">
        Beat tap · {count}/{taps}
      </p>
      <motion.button
        type="button"
        animate={pulse ? { scale: [1, 1.08, 1] } : {}}
        onClick={() => {
          if (count === 0) started.current = performance.now();
          const next = count + 1;
          setCount(next);
          setPulse(true);
          window.setTimeout(() => setPulse(false), 120);
          void triggerHaptic(8);
          if (next >= taps) {
            const ms = Math.round(performance.now() - started.current);
            playWinSting();
            onComplete(`Bassline locked · ${ms}ms for ${taps} taps`);
          }
        }}
        className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-full border border-violet-400/50 bg-gradient-to-br from-violet-600 to-cyan-500 font-display text-2xl font-black text-white shadow-[0_0_40px_rgba(124,58,237,0.35)] active:scale-95"
      >
        TAP
      </motion.button>
      <p className="mt-4 text-sm text-zinc-400">Hit the pad on the imagined kick.</p>
    </div>
  );
}

export function TwoTruthsEngine({
  statements,
  lieIndex,
  onComplete,
}: {
  statements: string[];
  lieIndex: number;
  onComplete: (label: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
        Two truths · one lie — find the fake
      </p>
      <div className="mt-4 space-y-2">
        {statements.map((s, i) => {
          const revealed = picked !== null;
          const isLie = i === lieIndex;
          return (
            <button
              key={s}
              type="button"
              disabled={revealed}
              onClick={() => {
                setPicked(i);
                playWinSting();
                onComplete(
                  i === lieIndex
                    ? `Caught the lie · ${s.slice(0, 42)}…`
                    : `Missed — lie was #${lieIndex + 1}`
                );
                void triggerHaptic(20);
              }}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all",
                revealed && isLie
                  ? "border-rose-400 bg-rose-500/20 text-rose-100"
                  : revealed && picked === i
                    ? "border-zinc-600 bg-zinc-900 text-zinc-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-violet-400"
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RedLightEngine({
  cues,
  onComplete,
}: {
  cues: string[];
  onComplete: (label: string) => void;
}) {
  const [mode, setMode] = useState<"green" | "red" | "idle">("idle");
  const [cue, setCue] = useState(cues[0] ?? "Freeze");

  function arm() {
    setMode("green");
    setCue(cues[Math.floor(Math.random() * cues.length)] ?? "Freeze");
    window.setTimeout(() => {
      setMode("red");
      void triggerHaptic([20, 40, 20]);
    }, 1200 + Math.random() * 1800);
  }

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
        Red light freeze frame
      </p>
      <motion.div
        animate={{
          backgroundColor:
            mode === "red" ? "#e11d48" : mode === "green" ? "#059669" : "#18181b",
        }}
        className="mx-auto mt-5 grid min-h-[140px] w-full place-items-center rounded-2xl border border-white/10 px-4"
      >
        <p className="font-display text-2xl font-black text-white">
          {mode === "idle" ? "Ready?" : mode === "green" ? "MOVE" : "FREEZE"}
        </p>
        {mode === "red" ? (
          <p className="mt-2 text-sm text-white/90">{cue}</p>
        ) : null}
      </motion.div>
      <PlayButton
        onClick={() => {
          if (mode === "red") {
            playWinSting();
            onComplete(`Freeze held · ${cue}`);
            setMode("idle");
            return;
          }
          arm();
        }}
      >
        {mode === "red" ? "We held it" : mode === "green" ? "Waiting for red…" : "Start round"}
      </PlayButton>
    </div>
  );
}

export function CharadesEngine({
  prompts,
  seconds = 45,
  onComplete,
}: {
  prompts: string[];
  seconds?: number;
  onComplete: (label: string) => void;
}) {
  const [prompt, setPrompt] = useState(
    () => prompts[Math.floor(Math.random() * prompts.length)] ?? "Act it out"
  );
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      onComplete(`Charades timeout · ${prompt}`);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, onComplete, prompt, running]);

  return (
    <div className={CARD}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
        Midnight charades · {left}s
      </p>
      <div className="mt-4 min-h-[100px] rounded-2xl border border-zinc-700 bg-zinc-900/80 p-5">
        <p className="font-display text-lg font-black text-white">
          {revealed ? prompt : "Pass the phone · actor only"}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide prompt" : "Reveal for actor"}
        </button>
        <button
          type="button"
          className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200"
          onClick={() => {
            setPrompt(
              prompts[Math.floor(Math.random() * prompts.length)] ?? prompt
            );
            setLeft(seconds);
            setRunning(true);
            setRevealed(true);
          }}
        >
          New prompt
        </button>
      </div>
      <PlayButton
        onClick={() => {
          playWinSting();
          onComplete(`Guessed · ${prompt}`);
        }}
      >
        Table guessed it
      </PlayButton>
    </div>
  );
}

export function HighLowEngine({
  rounds = 5,
  onComplete,
}: {
  rounds?: number;
  onComplete: (label: string) => void;
}) {
  const [card, setCard] = useState(() => 2 + Math.floor(Math.random() * 12));
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);

  function guess(dir: "high" | "low") {
    if (done) return;
    const next = 2 + Math.floor(Math.random() * 12);
    const win =
      (dir === "high" && next >= card) || (dir === "low" && next <= card);
    const nextStreak = win ? streak + 1 : 0;
    setCard(next);
    setStreak(nextStreak);
    void triggerHaptic(win ? 18 : 8);
    if (!win || nextStreak >= rounds) {
      setDone(true);
      playWinSting();
      onComplete(
        win
          ? `High-Low streak ${nextStreak}/${rounds}`
          : `Busted on ${next} after ${streak}`
      );
    }
  }

  return (
    <div className={CARD + " text-center"}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
        High-Low · streak {streak}/{rounds}
      </p>
      <p className="mt-6 font-display text-6xl font-black text-white">{card}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={done}
          onClick={() => guess("high")}
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 py-3 font-bold text-emerald-200 active:scale-95 disabled:opacity-40"
        >
          Higher
        </button>
        <button
          type="button"
          disabled={done}
          onClick={() => guess("low")}
          className="rounded-2xl border border-rose-500/40 bg-rose-500/15 py-3 font-bold text-rose-200 active:scale-95 disabled:opacity-40"
        >
          Lower
        </button>
      </div>
    </div>
  );
}
