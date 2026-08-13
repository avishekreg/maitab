"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTierTheme } from "@/components/theme/TierThemeProvider";

interface TierGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  /** Soft colored blob behind the card (Member Pass / status surfaces) */
  showAura?: boolean;
}

export function TierGlassCard({
  children,
  className,
  glow = true,
  showAura = false,
}: TierGlassCardProps) {
  const theme = useTierTheme();

  return (
    <div className={cn("relative", showAura && "isolate")}>
      {showAura ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] blur-2xl",
            theme.aura,
            theme.pulse && "animate-tier-pulse"
          )}
        />
      ) : null}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border",
          theme.panel,
          theme.border,
          glow && theme.glow,
          theme.pulse && glow && "animate-tier-pulse",
          className
        )}
      >
        {theme.shimmer ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/55 to-transparent"
            animate={{ x: ["-40%", "280%"] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 2.5,
            }}
          />
        ) : null}
        <div className="relative z-[1]">{children}</div>
      </div>
    </div>
  );
}

export function TierBadge({ className }: { className?: string }) {
  const theme = useTierTheme();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        theme.headerBadge,
        className
      )}
    >
      {theme.vip ? <Crown className="h-3.5 w-3.5 text-violet-600" /> : null}
      {theme.label}
      {theme.vip ? " · VIP" : ""}
    </span>
  );
}

export function TierProgressRing({
  value,
  max = 5000,
  label = "Tab",
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const theme = useTierTheme();
  const pct = Math.min(100, Math.round((value / max) * 100));
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="7"
          className={theme.ringTrack}
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={theme.ringFill}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="type-title text-sm text-foreground">{pct}%</p>
          <p className="text-[9px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
