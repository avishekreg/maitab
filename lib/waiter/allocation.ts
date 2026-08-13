import { DEMO_CLUB, DEMO_TABLES } from "@/lib/demo/data";
import { formatTokenDisplay } from "@/lib/kds/token";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

export interface ClubZone {
  id: string;
  venue_id: string;
  zone_name: string;
  table_range: number[];
}

export interface WaiterShift {
  id: string;
  venue_id: string;
  waiter_id: string;
  waiter_name: string;
  assigned_zone_id: string;
  active_status: boolean;
  logged_in_at: string;
}

export interface WaiterRouteAssignment {
  assigned_waiter_id: string;
  assigned_waiter_name: string;
  zone_id: string;
  zone_name: string;
  pickup_token_code: string;
}

/**
 * Demo floor map.
 * B-tables → raw number (B4 → 4). V-tables → 100 + n (V1 → 101).
 */
export const DEMO_CLUB_ZONES: ClubZone[] = [
  {
    id: "zone-main-floor",
    venue_id: DEMO_CLUB.id,
    zone_name: "Main Floor",
    table_range: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    id: "zone-vip-lounge",
    venue_id: DEMO_CLUB.id,
    zone_name: "VIP Lounge",
    table_range: [101, 102, 103],
  },
];

/** Mutable demo roster — Floor Manager portal writes here at runtime */
export let DEMO_WAITER_SHIFTS: WaiterShift[] = [
  {
    id: "shift-priya",
    venue_id: DEMO_CLUB.id,
    waiter_id: "waiter-priya-001",
    waiter_name: "Priya Nair",
    assigned_zone_id: "zone-main-floor",
    active_status: true,
    logged_in_at: new Date().toISOString(),
  },
  {
    id: "shift-arjun",
    venue_id: DEMO_CLUB.id,
    waiter_id: "waiter-arjun-001",
    waiter_name: "Arjun Mehta",
    assigned_zone_id: "zone-vip-lounge",
    active_status: true,
    logged_in_at: new Date().toISOString(),
  },
  {
    id: "shift-neha",
    venue_id: DEMO_CLUB.id,
    waiter_id: "waiter-neha-001",
    waiter_name: "Neha Shah",
    assigned_zone_id: "zone-main-floor",
    active_status: false,
    logged_in_at: new Date().toISOString(),
  },
];

export function assignWaiterZone(
  waiterId: string,
  zoneId: string,
  active = true
): WaiterShift | null {
  const idx = DEMO_WAITER_SHIFTS.findIndex((s) => s.waiter_id === waiterId);
  if (idx < 0) return null;
  const next = {
    ...DEMO_WAITER_SHIFTS[idx]!,
    assigned_zone_id: zoneId,
    active_status: active,
    logged_in_at: new Date().toISOString(),
  };
  DEMO_WAITER_SHIFTS = DEMO_WAITER_SHIFTS.map((s, i) =>
    i === idx ? next : s
  );
  return next;
}

export interface BartenderCounterShift {
  id: string;
  venue_id: string;
  bartender_id: string;
  bartender_name: string;
  assigned_counter_id: string;
  active_status: boolean;
}

export let DEMO_BARTENDER_SHIFTS: BartenderCounterShift[] = [
  {
    id: "bar-shift-ravi",
    venue_id: DEMO_CLUB.id,
    bartender_id: "bartender-ravi-001",
    bartender_name: "Ravi Bar",
    assigned_counter_id: "bc000000-0000-0000-0000-000000000001",
    active_status: true,
  },
  {
    id: "bar-shift-kira",
    venue_id: DEMO_CLUB.id,
    bartender_id: "bartender-kira-001",
    bartender_name: "Kira VIP",
    assigned_counter_id: "bc000000-0000-0000-0000-000000000002",
    active_status: true,
  },
];

export function assignBartenderCounter(
  bartenderId: string,
  counterId: string,
  active = true
): BartenderCounterShift | null {
  const idx = DEMO_BARTENDER_SHIFTS.findIndex(
    (s) => s.bartender_id === bartenderId
  );
  if (idx < 0) return null;
  const next = {
    ...DEMO_BARTENDER_SHIFTS[idx]!,
    assigned_counter_id: counterId,
    active_status: active,
  };
  DEMO_BARTENDER_SHIFTS = DEMO_BARTENDER_SHIFTS.map((s, i) =>
    i === idx ? next : s
  );
  return next;
}

/**
 * Parse floor codes for zone matching.
 * B4 / 4 → 4 (main). V1 → 101 (VIP offset) so VIP never collides with B1.
 */
export function tableCodeNumber(tableCode: string | null | undefined): number | null {
  if (!tableCode) return null;
  const trimmed = tableCode.trim().toUpperCase();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  if (trimmed.startsWith("V")) return 100 + n;
  return n;
}

export function resolveWaiterForTableNumber(
  tableNumber: number,
  venueId = NEON_CLUB_ID || DEMO_CLUB.id,
  zones: ClubZone[] = DEMO_CLUB_ZONES,
  shifts: WaiterShift[] = DEMO_WAITER_SHIFTS
): Omit<WaiterRouteAssignment, "pickup_token_code"> | null {
  const zone = zones.find(
    (z) => z.venue_id === venueId && z.table_range.includes(tableNumber)
  );
  if (!zone) return null;

  const shift = shifts
    .filter(
      (s) =>
        s.venue_id === venueId &&
        s.active_status &&
        s.assigned_zone_id === zone.id
    )
    .sort(
      (a, b) =>
        new Date(a.logged_in_at).getTime() - new Date(b.logged_in_at).getTime()
    )[0];

  if (!shift) return null;

  return {
    assigned_waiter_id: shift.waiter_id,
    assigned_waiter_name: shift.waiter_name,
    zone_id: zone.id,
    zone_name: zone.zone_name,
  };
}

export function resolveWaiterForTableId(
  tableId: string | null | undefined,
  tokenNumber: number,
  venueId = NEON_CLUB_ID || DEMO_CLUB.id
): WaiterRouteAssignment | null {
  const table = DEMO_TABLES.find((t) => t.id === tableId);
  const tableNumber = tableCodeNumber(table?.table_code);
  if (tableNumber == null) return null;

  const route = resolveWaiterForTableNumber(tableNumber, venueId);
  if (!route) return null;

  return {
    ...route,
    pickup_token_code: formatTokenDisplay(tokenNumber),
  };
}
