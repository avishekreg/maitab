import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SpendTier } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function tierLabel(tier: SpendTier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function tierAccent(tier: SpendTier): string {
  switch (tier) {
    case "BRONZE":
      return "text-status-bronze border-status-bronze/40 bg-status-bronze/10";
    case "SILVER":
      return "text-nightlife-muted border-white/15 bg-white/[0.03]";
    case "GOLD":
      return "text-accent-gold border-accent-gold/40 bg-accent-gold/10";
    case "TITAN":
      return "text-accent-violet border-accent-violet/40 bg-accent-violet/10";
  }
}

export async function triggerHaptic(
  pattern: number | number[] = [40, 60, 40]
): Promise<void> {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
