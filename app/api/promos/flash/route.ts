import { NextResponse } from "next/server";
import { assertNativePromoAllowed } from "@/lib/data/discounts";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActiveSession } from "@/lib/types";

/**
 * Real PostGIS anti-cannibalization via RPC `can_create_flash_promo`.
 * Falls back to simulated competitor lock when Supabase is not configured.
 * Optional sessionId enforces Phase 6 mutual exclusivity on the guest tab.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    clubId?: string;
    category?: string;
    radiusM?: number;
    lockoutMin?: number;
    sessionId?: string;
    session?: ActiveSession;
  };

  if (!body.clubId || !body.category) {
    return NextResponse.json(
      { ok: false, reason: "clubId and category are required" },
      { status: 400 }
    );
  }

  if (body.sessionId || body.session) {
    const gate = await assertNativePromoAllowed(
      body.sessionId ?? body.session!.id,
      body.session
    );
    if (!gate.ok) {
      return NextResponse.json(
        { ok: false, reason: gate.reason, exclusivity: true },
        { status: 409 }
      );
    }
  }

  const category = body.category.toUpperCase();
  const radiusM = body.radiusM ?? Number(process.env.ANTI_CANNIBALIZATION_RADIUS_M ?? 1500);
  const lockoutMin =
    body.lockoutMin ?? Number(process.env.ANTI_CANNIBALIZATION_LOCKOUT_MIN ?? 60);

  if (!isSupabaseConfigured()) {
    // Offline demo mirrors seeded competitor BEER lock within 1.5km.
    if (category === "BEER") {
      return NextResponse.json({
        ok: false,
        reason:
          "Blocked by PostGIS ST_DWithin: competitor BEER promo within 1.5km lockout window.",
        mode: "fallback",
      });
    }
    return NextResponse.json({ ok: true, mode: "fallback" });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("can_create_flash_promo", {
      p_club_id: body.clubId,
      p_category: category,
      p_radius_m: radiusM,
      p_lockout_min: lockoutMin,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message, mode: "live" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        ok: false,
        reason:
          "Blocked by PostGIS ST_DWithin: neighboring club holds an active category promo lockout.",
        mode: "live",
      });
    }

    return NextResponse.json({ ok: true, mode: "live" });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Promo RPC failed",
        mode: "live",
      },
      { status: 500 }
    );
  }
}
