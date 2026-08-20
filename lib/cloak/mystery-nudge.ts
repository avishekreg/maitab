/**
 * Mystery Shooter nudge — discreet KDS ticket only.
 * Does NOT touch payment gateways or discount APIs.
 * Caller should queue via session-store.addOrderItems (existing orders bus).
 */

import type { OrderItem } from "@/lib/types";

export function buildMysteryShooterItem(input: {
  toAlias: string;
  fromAlias: string;
}): OrderItem {
  return {
    name: "Mystery Shooter (Cloak)",
    quantity: 1,
    unit_price: 280,
    category: "SHOT",
    notes: `CLOAK_MYSTERY · discreet staff delivery · alias-only · do not announce table or guest name · to:${input.toAlias} · from:${input.fromAlias}`,
  };
}
