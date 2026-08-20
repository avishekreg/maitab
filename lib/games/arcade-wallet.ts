const KEY = "maitab-arcade-wallet";

export type ArcadeWallet = {
  points: number;
  coupons: string[];
};

export function readArcadeWallet(): ArcadeWallet {
  if (typeof window === "undefined") return { points: 0, coupons: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { points: 120, coupons: [] };
    return JSON.parse(raw) as ArcadeWallet;
  } catch {
    return { points: 120, coupons: [] };
  }
}

export function writeArcadeWallet(wallet: ArcadeWallet) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(wallet));
}

export function creditArcadeReward(label: string): ArcadeWallet {
  const current = readArcadeWallet();
  // Never treat bill discounts as arcade coupons — club-promoted only.
  if (/(\d+\s*%|\boff\b|\bdiscount\b)/i.test(label)) {
    return current;
  }
  const next: ArcadeWallet = {
    points: current.points + 25,
    coupons: label.toLowerCase().includes("spin again")
      ? current.coupons
      : [label, ...current.coupons].slice(0, 6),
  };
  writeArcadeWallet(next);
  return next;
}
