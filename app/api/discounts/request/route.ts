import { NextResponse, type NextRequest } from "next/server";
import {
  requestExternalDiscount,
  toBridgePayload,
} from "@/lib/data/discounts";
import type { ActiveSession, ExternalProvider } from "@/lib/types";

const ALLOWED: Exclude<ExternalProvider, "NONE">[] = [
  "ZOMATO_DISTRICT",
  "SWIGGY_DINEOUT",
  "EAZYDINER",
  "DIRECT",
];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    session?: ActiveSession;
    sessionId?: string;
    clubId?: string;
    provider?: ExternalProvider;
    voucherCode?: string;
    discountPercentage?: number;
  };

  if (!body.provider || !ALLOWED.includes(body.provider as Exclude<ExternalProvider, "NONE">)) {
    return NextResponse.json(
      { ok: false, reason: "valid provider required" },
      { status: 400 }
    );
  }

  if (!body.voucherCode?.trim()) {
    return NextResponse.json(
      { ok: false, reason: "voucherCode required" },
      { status: 400 }
    );
  }

  const session =
    body.session ??
    (body.sessionId && body.clubId
      ? ({
          id: body.sessionId,
          user_id: "",
          club_id: body.clubId,
          primary_table_id: "",
          total_session_spend: 0,
          is_lucky_draw_eligible: false,
          is_vip: false,
          status: "ACTIVE",
          started_at: new Date().toISOString(),
          ended_at: null,
          external_provider: "NONE",
          external_voucher_code: null,
          discount_percentage: 0,
          discount_status: null,
          discount_verified_by: null,
          is_native_promos_eligible: true,
        } satisfies ActiveSession)
      : null);

  if (!session) {
    return NextResponse.json(
      { ok: false, reason: "session or sessionId+clubId required" },
      { status: 400 }
    );
  }

  const result = await requestExternalDiscount({
    session,
    provider: body.provider as Exclude<ExternalProvider, "NONE">,
    voucherCode: body.voucherCode,
    discountPercentage: body.discountPercentage,
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
