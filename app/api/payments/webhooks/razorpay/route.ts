import { NextResponse } from "next/server";
import { razorpayProvider } from "@/lib/payments/providers/razorpay";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await razorpayProvider.verifyWebhook?.(
    request.headers,
    rawBody
  );

  if (!verified?.ok) {
    return NextResponse.json(
      { ok: false, reason: verified?.reason ?? "Webhook verification failed" },
      { status: 400 }
    );
  }

  // Hook point: map Razorpay events → session settlement / mandate status.
  // payment.authorized | payment.captured | token.confirmed | etc.
  return NextResponse.json({
    ok: true,
    provider: "razorpay",
    event: verified.event,
    handled: true,
  });
}
