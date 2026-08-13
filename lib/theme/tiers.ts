import type { SpendTier } from "@/lib/types";

export interface TierTheme {
  tier: SpendTier;
  label: string;
  badge: string;
  accent: string;
  accentSecondary: string;
  border: string;
  glow: string;
  button: string;
  ringTrack: string;
  ringFill: string;
  panel: string;
  headerBadge: string;
  navActive: string;
  ambient: string;
  shimmer?: boolean;
  pulse?: boolean;
  vip?: boolean;
}

export const TIER_THEMES: Record<SpendTier, TierTheme> = {
  BRONZE: {
    tier: "BRONZE",
    label: "Bronze",
    badge: "Tier 1",
    accent: "#94A3B8",
    accentSecondary: "#1E293B",
    border: "border-slate-700/80",
    glow: "shadow-[0_0_24px_rgba(30,41,59,0.45)]",
    button: "bg-slate-700 text-white hover:brightness-110",
    ringTrack: "stroke-slate-800",
    ringFill: "stroke-slate-400",
    panel:
      "border-slate-700/70 bg-white/[0.03] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]",
    headerBadge: "border-slate-600/50 bg-slate-800/60 text-slate-300",
    navActive: "text-slate-300",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.55),_transparent_55%)]",
  },
  SILVER: {
    tier: "SILVER",
    label: "Silver",
    badge: "Tier 2",
    accent: "#CBD5E1",
    accentSecondary: "#94A3B8",
    border: "border-slate-300/35",
    glow: "shadow-[0_0_28px_rgba(148,163,184,0.35)]",
    button:
      "bg-gradient-to-r from-slate-300 to-slate-100 text-nightlife-bg hover:brightness-105",
    ringTrack: "stroke-slate-700",
    ringFill: "stroke-slate-300",
    panel:
      "border-slate-300/25 bg-white/[0.04] backdrop-blur-xl",
    headerBadge: "border-slate-300/35 bg-white/[0.06] text-slate-200",
    navActive: "text-slate-200",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.22),_transparent_55%)]",
    shimmer: true,
  },
  GOLD: {
    tier: "GOLD",
    label: "Gold",
    badge: "Tier 3",
    accent: "#F59E0B",
    accentSecondary: "#D97706",
    border: "border-amber-400/40",
    glow: "shadow-[0_0_32px_rgba(245,158,11,0.35)]",
    button:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-nightlife-bg shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110",
    ringTrack: "stroke-amber-950",
    ringFill: "stroke-amber-400",
    panel:
      "border-amber-400/30 bg-amber-500/[0.06] backdrop-blur-xl shadow-[0_0_28px_rgba(245,158,11,0.12)]",
    headerBadge: "border-amber-400/35 bg-amber-500/10 text-amber-300",
    navActive: "text-amber-300",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.2),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(217,119,6,0.12),_transparent_45%)]",
    shimmer: true,
  },
  TITAN: {
    tier: "TITAN",
    label: "Titan",
    badge: "Legend",
    accent: "#8B5CF6",
    accentSecondary: "#F43F5E",
    border: "border-violet-400/40",
    glow: "shadow-[0_0_36px_rgba(139,92,246,0.4),0_0_48px_rgba(244,63,94,0.18)]",
    button:
      "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] hover:brightness-110",
    ringTrack: "stroke-violet-950",
    ringFill: "stroke-rose-400",
    panel:
      "border-violet-400/35 bg-violet-500/[0.08] backdrop-blur-xl shadow-[0_0_32px_rgba(139,92,246,0.2)]",
    headerBadge:
      "border-rose-400/35 bg-rose-500/10 text-rose-200",
    navActive: "text-violet-300",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.28),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(244,63,94,0.2),_transparent_45%)]",
    pulse: true,
    vip: true,
  },
};

export function getTierTheme(tier: SpendTier): TierTheme {
  return TIER_THEMES[tier] ?? TIER_THEMES.BRONZE;
}
