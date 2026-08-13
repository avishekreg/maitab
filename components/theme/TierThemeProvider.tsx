"use client";

import { createContext, useContext } from "react";
import type { SpendTier } from "@/lib/types";
import { getTierTheme, type TierTheme } from "@/lib/theme/tiers";

const TierThemeContext = createContext<TierTheme>(getTierTheme("GOLD"));

export function TierThemeProvider({
  tier,
  children,
}: {
  tier: SpendTier;
  children: React.ReactNode;
}) {
  return (
    <TierThemeContext.Provider value={getTierTheme(tier)}>
      {children}
    </TierThemeContext.Provider>
  );
}

export function useTierTheme(): TierTheme {
  return useContext(TierThemeContext);
}
