import { NextResponse, type NextRequest } from "next/server";
import { listPendingDiscountSessions } from "@/lib/data/discounts";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const clubId =
    request.nextUrl.searchParams.get("clubId") ?? NEON_CLUB_ID;
  const sessions = await listPendingDiscountSessions(clubId);
  return NextResponse.json({ ok: true, sessions });
}
