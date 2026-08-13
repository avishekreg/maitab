import { NextResponse } from "next/server";
import { settleSessionTab } from "@/lib/payments/autopay";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mandateId?: string;
    sessionId?: string;
    amount?: number;
    lat?: number;
    lng?: number;
    distanceMeters?: number;
  };

  if (!body.mandateId || !body.sessionId || body.amount == null) {
    return NextResponse.json(
      { ok: false, reason: "mandateId, sessionId, and amount are required" },
      { status: 400 }
    );
  }

  const result = await settleSessionTab({
    mandateId: body.mandateId,
    sessionId: body.sessionId,
    amount: body.amount,
    lat: body.lat,
    lng: body.lng,
    distanceMeters: body.distanceMeters,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
