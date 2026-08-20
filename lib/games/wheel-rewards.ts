/** House wheel rewards — never auto % bill discounts (club-promoted only). */

export const ALLOWED_WHEEL_REWARDS = [
  "Free Craft Shooter",
  "₹200 Saarthi Ride Voucher",
  "Table Dare",
  "DJ Song Request",
  "Spin Again",
] as const;

export type AllowedWheelReward = (typeof ALLOWED_WHEEL_REWARDS)[number];

const DISCOUNT_RE =
  /(\d+\s*%|\boff\b|\bdiscount\b|\bbill\b.*%|%\s*off)/i;

export function isDiscountRewardLabel(label: string): boolean {
  return DISCOUNT_RE.test(label);
}

/** Strip any discount-like outcomes; never invent bill % rewards. */
export function sanitizeWheelLabels(labels?: string[] | null): string[] {
  const cleaned = (labels ?? [])
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isDiscountRewardLabel(l));
  if (cleaned.length > 0) return cleaned;
  return [...ALLOWED_WHEEL_REWARDS];
}

/** House lucky-wheel only — always the approved non-discount set when empty/invalid. */
export function houseLuckyLabels(labels?: string[] | null): string[] {
  const cleaned = sanitizeWheelLabels(labels).filter(
    (l) => !isDiscountRewardLabel(l)
  );
  const preferred = cleaned.filter((l) =>
    (ALLOWED_WHEEL_REWARDS as readonly string[]).includes(l)
  );
  if (preferred.length >= 4) return preferred;
  if (cleaned.length >= 4 && cleaned.every((l) => !isDiscountRewardLabel(l))) {
    return cleaned;
  }
  return [...ALLOWED_WHEEL_REWARDS];
}
