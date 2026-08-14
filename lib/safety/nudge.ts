import type { Order } from "@/lib/types";

export const TRANSIT_NUDGE_DRINK_THRESHOLD = 3;

const NON_DRINK_CATEGORIES = new Set(["BITES", "SOFT", "FOOD"]);

export function sessionDrinkCount(orders: Order[], sessionId: string): number {
  return orders
    .filter((order) => order.session_id === sessionId)
    .flatMap((order) => order.items)
    .filter((item) => !NON_DRINK_CATEGORIES.has((item.category || "").toUpperCase()))
    .reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function shouldShowTransitNudge(input: {
  drinkCount: number;
  settleRequested?: boolean;
  dismissed?: boolean;
}): boolean {
  if (input.dismissed) return false;
  return (
    input.drinkCount >= TRANSIT_NUDGE_DRINK_THRESHOLD ||
    Boolean(input.settleRequested)
  );
}
