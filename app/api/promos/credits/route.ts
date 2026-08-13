import { NextResponse } from "next/server";
import { venueById } from "@/lib/demo/venues";
import { getCreditBalance, topUpCreditsDemo } from "@/lib/flash/campaigns";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Simulated Razorpay / Cashfree promo-credit top-up (SaaS revenue). */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    venueId?: string;
    amount?: number;
    provider?: "RAZORPAY" | "CASHFREE";
  };

  if (!body.venueId || !body.amount || body.amount <= 0 || !body.provider) {
    return NextResponse.json(
      { ok: false, reason: "venueId, amount, provider required" },
      { status: 400 }
    );
  }

  const venue = venueById(body.venueId);
  if (!venue) {
    return NextResponse.json(
      { ok: false, reason: "Unknown venue" },
      { status: 404 }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("topup_promo_credits", {
        p_venue_id: body.venueId,
        p_amount: body.amount,
        p_provider: body.provider,
        p_external_ref: `demo_${body.provider.toLowerCase()}_${Date.now()}`,
      });
      if (error) {
        return NextResponse.json(
          { ok: false, reason: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ok: true,
        mode: "live",
        credit_balance: Number(data),
        provider: body.provider,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          reason: err instanceof Error ? err.message : "Top-up failed",
        },
        { status: 500 }
      );
    }
  }

  const result = topUpCreditsDemo(venue, body.amount);
  return NextResponse.json({
    ok: true,
    mode: "demo",
    credit_balance: result.credit_balance,
    previous: getCreditBalance(venue) - body.amount,
    provider: body.provider,
  });
}
