import { NextResponse, type NextRequest } from "next/server";
import {
  applyCustomerUidCookie,
  mintCustomerUidCookie,
  verifyCustomerUidCookie,
  CUSTOMER_UID_COOKIE,
} from "@/lib/auth/customer-uid";
import { getGuestProfile } from "@/lib/auth/guest-identity";
import { buildRegistrationOptions } from "@/lib/auth/passkey";

export const runtime = "nodejs";

/** GET — registration options for 1-tap biometric enroll. */
export async function GET(request: NextRequest) {
  try {
    const existing = await verifyCustomerUidCookie(
      request.cookies.get(CUSTOMER_UID_COOKIE)?.value
    );
    const guest = existing ? getGuestProfile(existing) : undefined;
    const { options, guestId } = await buildRegistrationOptions(guest);
    const token = await mintCustomerUidCookie(guestId);
    const res = NextResponse.json({
      ok: true,
      guestId,
      options,
    });
    applyCustomerUidCookie(res, token);
    return res;
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Options failed",
      },
      { status: 500 }
    );
  }
}
