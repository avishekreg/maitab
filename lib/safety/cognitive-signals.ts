/**
 * Soft cognitive / motor impairment heuristics from phone interaction.
 * NOT a medical BAC test — used only for responsible hospitality nudges
 * (e.g. suggest mAISaarthi). Scores are probabilistic and privacy-preserving
 * (signals stay on-device; only a risk level is emitted).
 */

export type CognitiveRiskLevel = "clear" | "watch" | "elevated" | "high";

export type CognitiveSnapshot = {
  level: CognitiveRiskLevel;
  score: number; // 0..100
  reasons: string[];
  sampleSize: number;
  updatedAt: number;
};

type KeySample = { t: number; isBackspace: boolean };
type TapSample = { t: number; misTap: boolean };

const keySamples: KeySample[] = [];
const tapSamples: TapSample[] = [];
const MAX = 80;

export function recordKeystroke(isBackspace: boolean) {
  keySamples.push({ t: Date.now(), isBackspace });
  if (keySamples.length > MAX) keySamples.shift();
}

export function recordTap(misTap: boolean) {
  tapSamples.push({ t: Date.now(), misTap });
  if (tapSamples.length > MAX) tapSamples.shift();
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdev(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
}

export function computeCognitiveSnapshot(): CognitiveSnapshot {
  const reasons: string[] = [];
  let score = 0;

  const intervals: number[] = [];
  for (let i = 1; i < keySamples.length; i++) {
    const d = keySamples[i]!.t - keySamples[i - 1]!.t;
    if (d > 30 && d < 4000) intervals.push(d);
  }

  const backspaces = keySamples.filter((k) => k.isBackspace).length;
  const backspaceRate =
    keySamples.length > 0 ? backspaces / keySamples.length : 0;

  if (intervals.length >= 8) {
    const m = mean(intervals);
    const s = stdev(intervals);
    // Very slow typing
    if (m > 420) {
      score += 18;
      reasons.push("Slowed typing cadence");
    }
    // Erratic rhythm
    if (s > 280) {
      score += 22;
      reasons.push("Irregular keystroke rhythm");
    }
  }

  if (keySamples.length >= 12 && backspaceRate > 0.28) {
    score += 24;
    reasons.push("High correction / backspace rate");
  }

  const recentTaps = tapSamples.filter((t) => Date.now() - t.t < 60_000);
  const misRate =
    recentTaps.length > 0
      ? recentTaps.filter((t) => t.misTap).length / recentTaps.length
      : 0;
  if (recentTaps.length >= 10 && misRate > 0.22) {
    score += 26;
    reasons.push("Frequent off-target taps");
  }

  // Burst mis-taps (rage / impairment)
  const last8 = recentTaps.slice(-8);
  if (last8.filter((t) => t.misTap).length >= 4) {
    score += 14;
    reasons.push("Cluster of unintended taps");
  }

  score = Math.min(100, score);
  const level: CognitiveRiskLevel =
    score >= 70 ? "high" : score >= 45 ? "elevated" : score >= 25 ? "watch" : "clear";

  return {
    level,
    score,
    reasons,
    sampleSize: keySamples.length + tapSamples.length,
    updatedAt: Date.now(),
  };
}

export function shouldNudgeMaiSaarthi(snap: CognitiveSnapshot): boolean {
  return (
    (snap.level === "elevated" || snap.level === "high") &&
    snap.sampleSize >= 16
  );
}
