import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_UID_COOKIE,
  verifyCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import { buildAuthenticationOptions } from "@/lib/auth/passkey";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const guestId = await verifyCustomerUidCookie(
      request.cookies.get(CUSTOMER_UID_COOKIE)?.value
    );
    const options = await buildAuthenticationOptions(guestId ?? undefined);
    return NextResponse.json({ ok: true, options });
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
