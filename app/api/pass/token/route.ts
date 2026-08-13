import { NextResponse, type NextRequest } from "next/server";
import { DEMO_CUSTOMER } from "@/lib/demo/data";
import { signMemberPass } from "@/lib/qr/member-pass";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SpendTier } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    let userId = DEMO_CUSTOMER.id;
    let name = DEMO_CUSTOMER.full_name;
    let tier: SpendTier = DEMO_CUSTOMER.global_spend_tier;
    let mandate = DEMO_CUSTOMER.autopay_mandate_id;
    let visits = DEMO_CUSTOMER.lifetime_visits;

    const q = request.nextUrl.searchParams;
    if (q.get("userId")) userId = q.get("userId")!;
    if (q.get("name")) name = q.get("name")!;
    if (q.get("tier")) tier = q.get("tier") as SpendTier;
    if (q.get("mandate")) mandate = q.get("mandate");
    if (q.get("visits")) visits = Number(q.get("visits"));

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const { data: profile } = await supabase
            .from("users")
            .select(
              "full_name, global_spend_tier, autopay_mandate_id, lifetime_visits"
            )
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            name = profile.full_name;
            tier = profile.global_spend_tier as SpendTier;
            mandate = profile.autopay_mandate_id;
            visits = profile.lifetime_visits;
          }
        }
      } catch {
        // Fall through to query/demo profile.
      }
    }

    const token = signMemberPass({
      userId,
      name,
      tier,
      mandate,
      visits,
    });

    return NextResponse.json({
      ok: true,
      token,
      expiresInSec: 60 * 60 * 8,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Pass token failed",
      },
      { status: 500 }
    );
  }
}
