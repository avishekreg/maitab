import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestRole } from "@/lib/auth/api-guard";
import { attachSessionFromTableScan } from "@/lib/data/sessions";
import { verifyTableToken } from "@/lib/qr/hmac";
import { createClient } from "@/lib/supabase/server";
import { DEMO_CUSTOMER_ID, isSupabaseConfigured } from "@/lib/supabase/env";

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
    userId = role === "CUSTOMER" || !role ? DEMO_CUSTOMER_ID : DEMO_CUSTOMER_ID;
  }

  const result = await attachSessionFromTableScan({ payload, userId });

  const response = NextResponse.json(result, { status: result.ok ? 200 : 400 });
  if (result.ok) {
    response.cookies.set("maitab_session_id", result.sessionId, {
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
    });
    response.cookies.set("maitab_primary_table", result.primaryTableId, {
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "lax",
    });
  }
  return response;
}
