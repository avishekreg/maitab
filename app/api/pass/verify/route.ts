import { NextResponse } from "next/server";
import { verifyMemberPass } from "@/lib/qr/member-pass";

/**
 * Gate scanner verifies HMAC Member Pass tokens server-side.
 * Public to GATE roles via middleware; also used by demo gate cookie.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string };
  if (!body.token) {
    return NextResponse.json(
      { ok: false, reason: "token required" },
      { status: 400 }
    );
  }

  const payload = verifyMemberPass(body.token);
  if (!payload) {
    return NextResponse.json(
      { ok: false, reason: "Invalid or expired Member Pass" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    pass: {
      userId: payload.userId,
      name: payload.name,
      tier: payload.tier,
      mandate: payload.mandate,
      visits: payload.visits ?? 0,
      exp: payload.exp,
    },
  });
}
