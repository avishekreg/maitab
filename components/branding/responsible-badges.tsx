"use client";

import { cn } from "@/lib/utils";
import { useSaarthiBooking } from "@/components/saarthi/SaarthiProvider";

type BadgeDensity = "strip" | "stack" | "micro";

interface ResponsibleBadgesProps {
  density?: BadgeDensity;
  className?: string;
  onDark?: boolean;
}

/**
 * Ultra-luxury metallic compliance capsules — Drink Responsibly + MaiSaarthi.
 */
export function ResponsibleBadges({
  density = "strip",
  className,
}: ResponsibleBadgesProps) {
  const wrap =
    density === "stack"
      ? "flex flex-col gap-2"
      : density === "micro"
        ? "flex flex-wrap items-center justify-center gap-2"
        : "flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center";

  return (
    <div
      role="group"
      aria-label="Responsible hospitality"
      className={cn(wrap, className)}
    >
      <DrinkResponsiblyBadge />
      <DontDrinkAndDriveBadge />
    </div>
  );
}

function DrinkResponsiblyBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-zinc-950/80 px-4 py-2 shadow-[0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-md transition-all hover:border-amber-500/60">
      <GoldShieldIcon />
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
          Drink Responsibly
        </span>
        <span className="text-[10px] text-zinc-400">
          Know Your Limits • Zero Underage Service
        </span>
      </div>
    </div>
  );
}

function DontDrinkAndDriveBadge() {
  const saarthi = useSaarthiBooking();

  return (
    <button
      type="button"
      onClick={() => saarthi?.openBooking()}
      className="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-cyan-500/30 bg-zinc-950/80 px-4 py-2 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400/70"
    >
      <SteeringPulseIcon />
      <div className="flex flex-col text-left leading-tight">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Don&apos;t Drink &amp; Drive
        </span>
        <span className="text-[10px] text-zinc-300 transition-colors group-hover:text-cyan-300">
          Book a Verified MaiSaarthi Chauffeur ➔
        </span>
      </div>
    </button>
  );
}

function GoldShieldIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="gold-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path
        d="M20 4l12 5v9.2c0 7.4-4.8 14-12 16.6C12.8 32.2 8 25.6 8 18.2V9L20 4z"
        fill="url(#gold-shield)"
      />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fill="#1C1917"
        fontSize="11"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui"
      >
        21+
      </text>
    </svg>
  );
}

function SteeringPulseIcon() {
  return (
    <span className="relative grid h-9 w-9 place-items-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/20" />
      <svg viewBox="0 0 40 40" className="relative h-9 w-9" aria-hidden>
        <defs>
          <linearGradient id="cyan-wheel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="55%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="13" fill="none" stroke="url(#cyan-wheel)" strokeWidth="2.4" />
        <circle cx="20" cy="20" r="4" fill="url(#cyan-wheel)" />
        <path
          d="M20 7.5v8.2M11.2 24.8l6.2-3.4M28.8 24.8l-6.2-3.4"
          stroke="url(#cyan-wheel)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default ResponsibleBadges;
