import { NextResponse } from "next/server";
import { cashfreeProvider } from "@/lib/payments/providers/cashfree";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await cashfreeProvider.verifyWebhook?.(
    request.headers,
    rawBody
  );

  if (!verified?.ok) {
    return NextResponse.json(
      { ok: false, reason: verified?.reason ?? "Webhook verification failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "cashfree",
    event: verified.event,
    handled: true,
  });
}
