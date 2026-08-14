import { NEON_CLUB_ID } from "@/lib/supabase/env";

export interface StaffProfile {
  id: string;
  venue_id: string;
  full_name: string;
  staff_role: "WAITER" | "BARTENDER" | "FLOOR_MANAGER" | "CAPTAIN" | "GATE_STAFF";
  phone: string | null;
  active_status: boolean;
}

export interface MenuItemRow {
  id: string;
  venue_id: string;
  name: string;
  category: string;
  unit_price: number;
  active_status: boolean;
}

export interface ClubZoneRow {
  id: string;
  venue_id: string;
  zone_name: string;
  table_range: number[];
}

let staff: StaffProfile[] = [
  {
    id: "sp-priya",
    venue_id: NEON_CLUB_ID,
    full_name: "Priya Nair",
    staff_role: "WAITER",
    phone: "+919800000001",
    active_status: true,
  },
  {
    id: "sp-arjun",
    venue_id: NEON_CLUB_ID,
    full_name: "Arjun Mehta",
    staff_role: "WAITER",
    phone: "+919800000002",
    active_status: true,
  },
  {
    id: "sp-ravi",
    venue_id: NEON_CLUB_ID,
    full_name: "Ravi Bar",
    staff_role: "BARTENDER",
    phone: "+919800000003",
    active_status: true,
  },
];

let menu: MenuItemRow[] = [
  {
    id: "mi-1",
    venue_id: NEON_CLUB_ID,
    name: "Heineken",
    category: "BEER",
    unit_price: 350,
    active_status: true,
  },
  {
    id: "mi-2",
    venue_id: NEON_CLUB_ID,
    name: "Espresso Martini",
    category: "COCKTAIL",
    unit_price: 650,
    active_status: true,
  },
];

let zones: ClubZoneRow[] = [
  {
    id: "zone-main-floor",
    venue_id: NEON_CLUB_ID,
    zone_name: "Main Floor",
    table_range: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    id: "zone-vip-lounge",
    venue_id: NEON_CLUB_ID,
    zone_name: "VIP Lounge",
    table_range: [101, 102, 103],
  },
];

export function listStaff(venueId: string) {
  return staff.filter((s) => s.venue_id === venueId);
}

export function upsertStaff(
  input: Omit<StaffProfile, "id"> & { id?: string }
): StaffProfile {
  if (input.id) {
    staff = staff.map((s) =>
      s.id === input.id ? { ...s, ...input, id: input.id } : s
    );
    return staff.find((s) => s.id === input.id)!;
  }
  const row: StaffProfile = {
    ...input,
    id: `sp-${crypto.randomUUID()}`,
  };
  staff = [row, ...staff];
  return row;
}

export function deleteStaff(id: string) {
  staff = staff.filter((s) => s.id !== id);
}

export function listMenu(venueId: string) {
  return menu.filter((m) => m.venue_id === venueId);
}

export function upsertMenu(
  input: Omit<MenuItemRow, "id"> & { id?: string }
): MenuItemRow {
  if (input.id) {
    menu = menu.map((m) =>
      m.id === input.id ? { ...m, ...input, id: input.id } : m
    );
    return menu.find((m) => m.id === input.id)!;
  }
  const row: MenuItemRow = { ...input, id: `mi-${crypto.randomUUID()}` };
  menu = [row, ...menu];
  return row;
}

export function deleteMenu(id: string) {
  menu = menu.filter((m) => m.id !== id);
}

export function listZones(venueId: string) {
  return zones.filter((z) => z.venue_id === venueId);
}

export function upsertZone(
  input: Omit<ClubZoneRow, "id"> & { id?: string }
): ClubZoneRow {
  if (input.id) {
    zones = zones.map((z) =>
      z.id === input.id ? { ...z, ...input, id: input.id } : z
    );
    return zones.find((z) => z.id === input.id)!;
  }
  const row: ClubZoneRow = { ...input, id: `zone-${crypto.randomUUID()}` };
  zones = [row, ...zones];
  return row;
}

export function deleteZone(id: string) {
  zones = zones.filter((z) => z.id !== id);
}
