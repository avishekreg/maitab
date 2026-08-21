import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_UID_COOKIE,
  applyCustomerUidCookie,
  mintCustomerUidCookie,
  verifyCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import {
  createGuestProfile,
  getGuestProfile,
  listNightHistory,
} from "@/lib/auth/guest-identity";
import { guestToUserProfile } from "@/lib/sessions/guest-session";

export const runtime = "nodejs";

/** Permanent guest profile + night timeline for /home dashboard. */
export async function GET(request: NextRequest) {
  let uid = await verifyCustomerUidCookie(
    request.cookies.get(CUSTOMER_UID_COOKIE)?.value
  );
  let created = false;
  if (!uid || !getGuestProfile(uid)) {
    const profile = createGuestProfile({ full_name: "Guest" });
    uid = profile.id;
    created = true;
  }
  const guest = getGuestProfile(uid)!;
  const history = listNightHistory(uid);
  const token = await mintCustomerUidCookie(uid);
  const res = NextResponse.json({
    ok: true,
    created,
    user: guestToUserProfile(guest),
    history,
    summary: {
      lifetime_spend: guest.lifetime_spend,
      lifetime_visits: guest.lifetime_visits || history.length,
      loyalty_points: guest.loyalty_points,
      vip_tier: guest.vip_tier,
      passkey_enrolled: Boolean(guest.passkey),
      saarthi_rides: history.filter((h) => h.saarthi_trip_id).length,
    },
  });
  applyCustomerUidCookie(res, token);
  return res;
}
