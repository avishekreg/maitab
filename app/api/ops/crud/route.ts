import { NextResponse, type NextRequest } from "next/server";
import {
  deleteMenu,
  deleteStaff,
  deleteZone,
  listMenu,
  listStaff,
  listZones,
  upsertMenu,
  upsertStaff,
  upsertZone,
} from "@/lib/ops/crud-store";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

type Entity = "staff" | "menu" | "zones";

function venueId(request: NextRequest, body?: { venueId?: string }) {
  return (
    body?.venueId ||
    request.nextUrl.searchParams.get("venueId") ||
    NEON_CLUB_ID
  );
}

export async function GET(request: NextRequest) {
  const entity = (request.nextUrl.searchParams.get("entity") ||
    "staff") as Entity;
  const id = venueId(request);

  if (entity === "menu") {
    return NextResponse.json({ ok: true, items: listMenu(id) });
  }
  if (entity === "zones") {
    return NextResponse.json({ ok: true, items: listZones(id) });
  }
  return NextResponse.json({ ok: true, items: listStaff(id) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const entity = String(body.entity || "staff") as Entity;
  const id = venueId(request, body as { venueId?: string });

  if (entity === "menu") {
    const item = upsertMenu({
      id: body.id ? String(body.id) : undefined,
      venue_id: id,
      name: String(body.name || "New item"),
      category: String(body.category || "OTHER"),
      unit_price: Number(body.unit_price ?? 0),
      active_status: body.active_status !== false,
    });
    return NextResponse.json({ ok: true, item });
  }

  if (entity === "zones") {
    const tables = Array.isArray(body.table_range)
      ? (body.table_range as number[])
      : String(body.table_range || "")
          .split(",")
          .map((n) => Number(n.trim()))
          .filter((n) => !Number.isNaN(n));
    const item = upsertZone({
      id: body.id ? String(body.id) : undefined,
      venue_id: id,
      zone_name: String(body.zone_name || "New zone"),
      table_range: tables,
    });
    return NextResponse.json({ ok: true, item });
  }

  const item = upsertStaff({
    id: body.id ? String(body.id) : undefined,
    venue_id: id,
    full_name: String(body.full_name || "New staff"),
    staff_role: (body.staff_role as "WAITER" | "BARTENDER") || "WAITER",
    phone: body.phone ? String(body.phone) : null,
    active_status: body.active_status !== false,
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { entity?: Entity; id?: string };
  if (!body.id) {
    return NextResponse.json(
      { ok: false, reason: "id required" },
      { status: 400 }
    );
  }
  const entity = body.entity || "staff";
  if (entity === "menu") deleteMenu(body.id);
  else if (entity === "zones") deleteZone(body.id);
  else deleteStaff(body.id);
  return NextResponse.json({ ok: true });
}
