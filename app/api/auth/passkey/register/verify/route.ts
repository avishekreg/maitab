import { NextResponse, type NextRequest } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import {
  applyCustomerUidCookie,
  mintCustomerUidCookie,
  CUSTOMER_UID_COOKIE,
  verifyCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import { verifyRegistration } from "@/lib/auth/passkey";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      guestId?: string;
      response?: RegistrationResponseJSON;
    };
    const cookieUid = await verifyCustomerUidCookie(
      request.cookies.get(CUSTOMER_UID_COOKIE)?.value
    );
    const guestId = body.guestId || cookieUid;
    if (!guestId || !body.response) {
      return NextResponse.json(
        { ok: false, error: "guestId and response required" },
        { status: 400 }
      );
    }
    const profile = await verifyRegistration(guestId, body.response);
    const token = await mintCustomerUidCookie(profile.id);
    const res = NextResponse.json({
      ok: true,
      guest: {
        id: profile.id,
        full_name: profile.full_name,
        vip_tier: profile.vip_tier,
        loyalty_points: profile.loyalty_points,
        lifetime_spend: profile.lifetime_spend,
        passkey_enrolled: Boolean(profile.passkey),
      },
    });
    applyCustomerUidCookie(res, token);
    return res;
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Verify failed",
      },
      { status: 400 }
    );
  }
}
