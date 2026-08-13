import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestRole } from "@/lib/auth/api-guard";
import {
  approveExternalDiscount,
  rejectExternalDiscount,
  toBridgePayload,
} from "@/lib/data/discounts";
import type { ActiveSession } from "@/lib/types";

/** Seeded bartender id from supabase/seed.sql */
const DEMO_BARTENDER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    sessionId?: string;
    action?: "approve" | "reject";
    discountPercentage?: number;
    staffUserId?: string;
    fallbackSession?: ActiveSession;
  };

  if (!body.sessionId) {
    return NextResponse.json(
      { ok: false, reason: "sessionId required" },
      { status: 400 }
    );
  }

  const action = body.action ?? "approve";
  await resolveRequestRole(request);
  const staffUserId = body.staffUserId ?? DEMO_BARTENDER_ID;

  const result =
    action === "reject"
      ? await rejectExternalDiscount({
          sessionId: body.sessionId,
          staffUserId,
          fallbackSession: body.fallbackSession,
        })
      : await approveExternalDiscount({
          sessionId: body.sessionId,
          staffUserId,
          discountPercentage: body.discountPercentage,
          fallbackSession: body.fallbackSession,
        });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    session: result.session,
    bridge: toBridgePayload(result.session),
  });
}
