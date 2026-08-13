import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  assignBartenderCounter,
  assignWaiterZone,
} from "@/lib/waiter/allocation";

/**
 * Floor Manager shift allocation — demo mutates in-memory roster;
 * live mode upserts staff_bar_assignments / waiter_shifts when available.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    venueId?: string;
    kind?: "WAITER_ZONE" | "BARTENDER_COUNTER";
    staffId?: string;
    staffName?: string;
    zoneId?: string;
    counterId?: string;
    active?: boolean;
  };

  if (!body.venueId || !body.kind || !body.staffId || !body.staffName) {
    return NextResponse.json(
      { ok: false, reason: "venueId, kind, staffId, staffName required" },
      { status: 400 }
    );
  }

  if (body.kind === "WAITER_ZONE") {
    if (!body.zoneId) {
      return NextResponse.json(
        { ok: false, reason: "zoneId required" },
        { status: 400 }
      );
    }
    const demo = assignWaiterZone(body.staffId, body.zoneId, body.active ?? true);

    if (isSupabaseConfigured()) {
      try {
        const admin = createAdminClient();
        await admin.from("waiter_shifts").insert({
          venue_id: body.venueId,
          waiter_id: body.staffId,
          waiter_name: body.staffName,
          assigned_zone_id: body.zoneId,
          active_status: body.active ?? true,
        });
        await admin.from("staff_bar_assignments").insert({
          venue_id: body.venueId,
          staff_id: body.staffId,
          staff_name: body.staffName,
          staff_role: "WAITER",
          assigned_zone_id: body.zoneId,
          active_status: body.active ?? true,
        });
      } catch {
        /* demo continues */
      }
    }

    return NextResponse.json({
      ok: true,
      mode: isSupabaseConfigured() ? "live" : "demo",
      shift: demo,
    });
  }

  if (!body.counterId) {
    return NextResponse.json(
      { ok: false, reason: "counterId required" },
      { status: 400 }
    );
  }

  const demo = assignBartenderCounter(
    body.staffId,
    body.counterId,
    body.active ?? true
  );

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await admin.from("staff_bar_assignments").insert({
        venue_id: body.venueId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        staff_role: "BARTENDER",
        assigned_counter_id: body.counterId,
        active_status: body.active ?? true,
      });
    } catch {
      /* demo continues */
    }
  }

  return NextResponse.json({
    ok: true,
    mode: isSupabaseConfigured() ? "live" : "demo",
    shift: demo,
  });
}
