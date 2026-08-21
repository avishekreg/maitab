import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestRole } from "@/lib/auth/api-guard";
import {
  CUSTOMER_UID_COOKIE,
  applyCustomerUidCookie,
  mintCustomerUidCookie,
  verifyCustomerUidCookie,
} from "@/lib/auth/customer-uid";
import {
  createGuestProfile,
  getGuestProfile,
} from "@/lib/auth/guest-identity";
import { attachSessionFromTableScan } from "@/lib/data/sessions";
import { attachGuestToVenue } from "@/lib/sessions/guest-session";
import { verifyTableToken } from "@/lib/qr/hmac";
import { createClient } from "@/lib/supabase/server";
import { DEMO_CUSTOMER_ID, isSupabaseConfigured } from "@/lib/supabase/env";
import { clubNameForId } from "@/lib/auth/guest-identity";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string;
    userId?: string;
  };

  if (!body.token) {
    return NextResponse.json(
      { ok: false, reason: "token required" },
      { status: 400 }
    );
  }

  const secret = process.env.TABLE_QR_HMAC_SECRET;
  if (!secret || secret.includes("replace-with")) {
    return NextResponse.json(
      { ok: false, reason: "TABLE_QR_HMAC_SECRET required" },
      { status: 500 }
    );
  }

  const payload = verifyTableToken(body.token);
  if (!payload) {
    return NextResponse.json(
      { ok: false, reason: "Invalid or tampered table QR" },
      { status: 400 }
    );
  }

  // Layer 1 — permanent guest from CUSTOMER_UID cookie (or create)
  let guestId = await verifyCustomerUidCookie(
    request.cookies.get(CUSTOMER_UID_COOKIE)?.value
  );
  if (!guestId || !getGuestProfile(guestId)) {
    guestId = createGuestProfile({ full_name: "Guest" }).id;
  }

  let userId = body.userId ?? null;
  if (!userId && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  if (!userId) {
    const { role } = await resolveRequestRole(request);
    void role;
    // Prefer permanent guest id for demo attach; live DB may still need seeded DEMO_CUSTOMER_ID
    userId = isSupabaseConfigured() ? DEMO_CUSTOMER_ID : guestId;
  }

  const result = await attachSessionFromTableScan({ payload, userId });

  // Layer 2 — ephemeral night attachment bound to permanent guest
  const night = attachGuestToVenue({
    guestId,
    clubId: result.clubId || payload.clubId,
    tableId: result.primaryTableId || payload.tableId,
    tableCode: result.primaryTableCode || payload.tableCode,
    sessionId: result.sessionId,
  });

  const response = NextResponse.json(
    {
      ...result,
      guestId,
      clubName: night.club_name || clubNameForId(night.club_id),
      tableCode: night.table_code,
      nightStatus: night.status,
    },
    { status: result.ok ? 200 : 400 }
  );

  const uidToken = await mintCustomerUidCookie(guestId);
  applyCustomerUidCookie(response, uidToken);

  if (result.ok) {
    response.cookies.set("maitab_session_id", result.sessionId, {
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
      httpOnly: true,
    });
    response.cookies.set("maitab_primary_table", result.primaryTableId, {
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
      httpOnly: true,
    });
    response.cookies.set("maitab_club_id", result.clubId, {
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return response;
}
