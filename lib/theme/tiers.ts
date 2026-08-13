import type { SpendTier } from "@/lib/types";

export interface TierTheme {
  tier: SpendTier;
  label: string;
  badge: string;
  accent: string;
  accentSecondary: string;
  /** Hairline / metallic border class applied on TierGlassCard */
  border: string;
  /** Soft glow / aura shadow class */
  glow: string;
  button: string;
  ringTrack: string;
  ringFill: string;
  panel: string;
  headerBadge: string;
  navActive: string;
  ambient: string;
  /** Optional outer aura blob behind Member Pass / hero cards */
  aura: string;
  shimmer?: boolean;
  pulse?: boolean;
  vip?: boolean;
}

/**
 * Tier chrome layered on Optimus warm-stone glass.
 * Accents change per spend tier without overriding core design tokens.
 */
export const TIER_THEMES: Record<SpendTier, TierTheme> = {
  BRONZE: {
    tier: "BRONZE",
    label: "Bronze",
    badge: "Tier 1",
    accent: "#b45309",
    accentSecondary: "#d97706",
    border: "border-amber-700/40",
    glow: "shadow-[0_10px_28px_-8px_rgba(120,53,15,0.10)] shadow-amber-900/10",
    button:
      "bg-amber-800 text-white shadow-[0_8px_20px_rgba(120,53,15,0.18)] hover:brightness-110",
    ringTrack: "stroke-amber-100",
    ringFill: "stroke-amber-700",
    panel: "optimus-glass rounded-xl",
    headerBadge: "border-amber-700/40 bg-amber-50 text-amber-900",
    navActive: "bg-amber-50 text-amber-900",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.10),_transparent_55%)]",
    aura: "bg-[radial-gradient(circle,_rgba(180,83,9,0.18),_transparent_65%)]",
  },
  SILVER: {
    tier: "SILVER",
    label: "Silver",
    badge: "Tier 2",
    accent: "#64748b",
    accentSecondary: "#94a3b8",
    border: "border-slate-300/50",
    glow: "shadow-[0_10px_28px_-8px_rgba(148,163,184,0.20)] shadow-slate-400/20",
    button:
      "bg-slate-700 text-white shadow-[0_8px_20px_rgba(100,116,139,0.22)] hover:brightness-110",
    ringTrack: "stroke-slate-200",
    ringFill: "stroke-slate-400",
    panel: "optimus-glass rounded-xl",
    headerBadge: "border-slate-300/50 bg-slate-50 text-slate-700",
    navActive: "bg-slate-100 text-slate-800",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.14),_transparent_55%)]",
    aura: "bg-[radial-gradient(circle,_rgba(148,163,184,0.22),_transparent_65%)]",
    shimmer: true,
  },
  GOLD: {
    tier: "GOLD",
    label: "Gold",
    badge: "Tier 3",
    accent: "#E2B857",
    accentSecondary: "#f59e0b",
    border: "border-[#E2B857]",
    glow: "shadow-[0_12px_36px_-6px_rgba(226,184,87,0.28)] shadow-[#E2B857]/20",
    button:
      "bg-[#E2B857] text-[#1c1408] shadow-[0_10px_28px_rgba(226,184,87,0.35)] hover:brightness-105",
    ringTrack: "stroke-amber-100",
    ringFill: "stroke-[#E2B857]",
    panel: "optimus-glass rounded-xl",
    headerBadge: "border-[#E2B857]/70 bg-[#E2B857]/15 text-amber-900",
    navActive: "bg-[#E2B857]/20 text-amber-900",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(226,184,87,0.18),_transparent_55%)]",
    aura: "bg-[radial-gradient(circle,_rgba(226,184,87,0.35),_transparent_62%)]",
    shimmer: true,
  },
  TITAN: {
    tier: "TITAN",
    label: "Titanium",
    badge: "VIP",
    accent: "#8b5cf6",
    accentSecondary: "#06b6d4",
    border: "border-violet-500",
    glow: "shadow-[0_12px_40px_-6px_rgba(139,92,246,0.35)] shadow-violet-500/30",
    button:
      "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-500/30 hover:brightness-110",
    ringTrack: "stroke-violet-100",
    ringFill: "stroke-violet-500",
    panel: "optimus-glass rounded-xl",
    headerBadge: "border-violet-500/60 bg-violet-50 text-violet-800",
    navActive: "bg-violet-50 text-violet-800",
    ambient:
      "bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.16),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.10),_transparent_45%)]",
    aura: "bg-[radial-gradient(circle,_rgba(139,92,246,0.40),_transparent_60%)]",
    pulse: true,
    vip: true,
  },
};

export function getTierTheme(tier: SpendTier): TierTheme {
  return TIER_THEMES[tier] ?? TIER_THEMES.BRONZE;
}
