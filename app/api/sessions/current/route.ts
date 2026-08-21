import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_UID_COOKIE,
  verifyCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import { buildGuestHydration } from "@/lib/sessions/guest-session";
import { DEMO_CLUB, DEMO_CUSTOMER, DEMO_ORDERS, DEMO_SESSION, DEMO_TABLES } from "@/lib/demo/data";

export const runtime = "nodejs";

/**
 * Hydrate permanent guest identity + open nightly attachment for /home and /tab.
 * Prefer CUSTOMER_UID cookie; fall back to demo Rahul + Neon when unset.
 */
export async function GET(request: NextRequest) {
  const uid = await verifyCustomerUidCookie(
    request.cookies.get(CUSTOMER_UID_COOKIE)?.value
  );

  if (uid) {
    const hydrated = buildGuestHydration(uid);
    if (hydrated) {
      return NextResponse.json({
        ok: true,
        mode: "guest_identity",
        ...hydrated,
      });
    }
  }

  const primary = DEMO_TABLES.find((t) => t.id === DEMO_SESSION.primary_table_id);
  return NextResponse.json({
    ok: true,
    mode: "demo_fallback",
    user: {
      ...DEMO_CUSTOMER,
      loyalty_points: 1840,
      lifetime_spend: 128400,
      vip_tier: "GOLD",
      passkey_enrolled: false,
    },
    session: DEMO_SESSION,
    venue: {
      club_id: DEMO_CLUB.id,
      club_name: DEMO_CLUB.name,
      table_id: DEMO_SESSION.primary_table_id,
      table_code: primary?.table_code ?? "B4",
    },
    history: [],
    orders: DEMO_ORDERS,
  });
}
