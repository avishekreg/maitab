import { NextResponse } from "next/server";
import { sessionCanUseNativePromos } from "@/lib/discounts/bridge";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_SESSION } from "@/lib/demo/data";
import { isSupabaseConfigured, NEON_CLUB_ID } from "@/lib/supabase/env";
import type { ActiveSession } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    clubId?: string;
    /** Optional in-memory session snapshot for offline exclusivity checks */
    sessionSnapshot?: ActiveSession;
  };
  const clubId = body.clubId ?? NEON_CLUB_ID;

  if (!isSupabaseConfigured()) {
    const snap = body.sessionSnapshot ?? DEMO_SESSION;
    if (!sessionCanUseNativePromos(snap)) {
      return NextResponse.json({
        ok: true,
        mode: "fallback",
        sessionId: null,
        message:
          "No eligible sessions — external deal tabs are excluded from lucky draw.",
      });
    }
    const award = {
      id: `ld-${Date.now()}`,
      club_id: clubId,
      session_id: snap.id,
      discount_percent: 25,
      awarded_at: new Date().toISOString(),
    };
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      sessionId: award.session_id,
      award,
    });
  }

  try {
    const supabase = createAdminClient();
    const { data: sessionId, error } = await supabase.rpc(
      "run_hourly_lucky_draw",
      { p_club_id: clubId }
    );

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message, mode: "live" },
        { status: 500 }
      );
    }

    if (!sessionId) {
      return NextResponse.json({
        ok: true,
        mode: "live",
        sessionId: null,
        message: "No eligible sessions this hour",
      });
    }

    const { data: award } = await supabase
      .from("lucky_draw_awards")
      .select("*")
      .eq("session_id", sessionId)
      .order("awarded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      mode: "live",
      sessionId,
      award,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Lucky draw failed",
      },
      { status: 500 }
    );
  }
}
