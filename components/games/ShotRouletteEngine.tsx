"use client";

import { LuckyWheel } from "@/components/games/lucky-wheel";

export function ShotRouletteEngine({
  outcomes,
  spinning,
  onComplete,
}: {
  outcomes: string[];
  spinning: boolean;
  onComplete: (outcome: string) => void;
}) {
  return (
    <LuckyWheel
      labels={outcomes.length ? outcomes : ["Safe", "Shot"]}
      spinning={spinning}
      onComplete={onComplete}
      accent="#F9A8D4"
      celebrate
    />
  );
}
