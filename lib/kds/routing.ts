import { DEMO_CLUB, DEMO_TABLES } from "@/lib/demo/data";
import { tableCodeNumber } from "@/lib/waiter/allocation";
import { NEON_CLUB_ID, NEON_SKY_CLUB_ID } from "@/lib/supabase/env";

export interface BarCounter {
  id: string;
  venue_id: string;
  counter_name: string;
  counter_code: string;
  is_vip: boolean;
  active_status: boolean;
}

export interface BarRouteAssignment {
  assigned_counter_id: string;
  assigned_counter_name: string;
  counter_code: string;
  is_vip: boolean;
}

/** Demo counters — Main + VIP for Neon District; Sky Bar for Sky Lounge */
export const DEMO_BAR_COUNTERS: BarCounter[] = [
  {
    id: "bc000000-0000-0000-0000-000000000001",
    venue_id: DEMO_CLUB.id,
    counter_name: "Main Bar (Counter 1)",
    counter_code: "MAIN_1",
    is_vip: false,
    active_status: true,
  },
  {
    id: "bc000000-0000-0000-0000-000000000002",
    venue_id: DEMO_CLUB.id,
    counter_name: "VIP Bar (Counter 2)",
    counter_code: "VIP_2",
    is_vip: true,
    active_status: true,
  },
  {
    id: "bc000000-0000-0000-0000-000000000003",
    venue_id: NEON_SKY_CLUB_ID,
    counter_name: "Sky Bar (Counter 1)",
    counter_code: "SKY_1",
    is_vip: false,
    active_status: true,
  },
];

/** table_number → counter_id (B1–B10 → Main, V1–V3 → VIP) */
export const DEMO_BAR_TABLE_MAP: Record<string, Record<number, string>> = {
  [NEON_CLUB_ID]: {
    1: "bc000000-0000-0000-0000-000000000001",
    2: "bc000000-0000-0000-0000-000000000001",
    3: "bc000000-0000-0000-0000-000000000001",
    4: "bc000000-0000-0000-0000-000000000001",
    5: "bc000000-0000-0000-0000-000000000001",
    6: "bc000000-0000-0000-0000-000000000001",
    7: "bc000000-0000-0000-0000-000000000001",
    8: "bc000000-0000-0000-0000-000000000001",
    9: "bc000000-0000-0000-0000-000000000001",
    10: "bc000000-0000-0000-0000-000000000001",
    101: "bc000000-0000-0000-0000-000000000002",
    102: "bc000000-0000-0000-0000-000000000002",
    103: "bc000000-0000-0000-0000-000000000002",
  },
  [NEON_SKY_CLUB_ID]: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      i + 1,
      "bc000000-0000-0000-0000-000000000003",
    ])
  ),
};

export function resolveBarCounterForTableNumber(
  tableNumber: number,
  venueId = NEON_CLUB_ID || DEMO_CLUB.id
): BarRouteAssignment | null {
  const counterId = DEMO_BAR_TABLE_MAP[venueId]?.[tableNumber];
  if (!counterId) return null;
  const counter = DEMO_BAR_COUNTERS.find(
    (c) => c.id === counterId && c.venue_id === venueId && c.active_status
  );
  if (!counter) return null;
  return {
    assigned_counter_id: counter.id,
    assigned_counter_name: counter.counter_name,
    counter_code: counter.counter_code,
    is_vip: counter.is_vip,
  };
}

export function resolveBarCounterForTableId(
  tableId: string | null | undefined,
  venueId = NEON_CLUB_ID || DEMO_CLUB.id
): BarRouteAssignment | null {
  const table = DEMO_TABLES.find((t) => t.id === tableId);
  const tableNumber = tableCodeNumber(table?.table_code);
  if (tableNumber == null) return null;
  return resolveBarCounterForTableNumber(tableNumber, venueId);
}

/** Waiter token card line: TOKEN #4829 ➔ PICKUP FROM: MAIN BAR (COUNTER 1) */
export function formatPickupRouteLine(
  tokenCode: string,
  counterName: string | null | undefined
): string {
  const pickup = (counterName ?? "BAR").toUpperCase();
  return `TOKEN ${tokenCode} ➔ PICKUP FROM: ${pickup}`;
}
