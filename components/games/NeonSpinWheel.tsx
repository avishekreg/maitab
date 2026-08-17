"use client";

import { LuckyWheel } from "@/components/games/lucky-wheel";

export function NeonSpinWheel({
  labels,
  spinning,
  onComplete,
  accent = "#A855F7",
}: {
  labels: string[];
  spinning: boolean;
  onComplete: (label: string) => void;
  accent?: string;
}) {
  return (
    <LuckyWheel
      labels={labels}
      spinning={spinning}
      onComplete={onComplete}
      accent={accent}
      celebrate
    />
  );
}
