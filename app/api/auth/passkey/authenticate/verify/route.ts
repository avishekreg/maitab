import { NextResponse, type NextRequest } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import {
  applyCustomerUidCookie,
  mintCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import { verifyAuthentication } from "@/lib/auth/passkey";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      response?: AuthenticationResponseJSON;
    };
    if (!body.response) {
      return NextResponse.json(
        { ok: false, error: "response required" },
        { status: 400 }
      );
    }
    const profile = await verifyAuthentication(body.response);
    const token = await mintCustomerUidCookie(profile.id);
    const res = NextResponse.json({
      ok: true,
      guest: {
        id: profile.id,
        full_name: profile.full_name,
        vip_tier: profile.vip_tier,
        loyalty_points: profile.loyalty_points,
        lifetime_spend: profile.lifetime_spend,
        passkey_enrolled: true,
      },
    });
    applyCustomerUidCookie(res, token);
    return res;
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Auth failed",
      },
      { status: 400 }
    );
  }
}
