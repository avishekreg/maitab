import type { NextResponse } from "next/server";
import { secureCookieOptions } from "@/lib/security/session-cookies";

export const CUSTOMER_UID_COOKIE = "maitab_customer_uid";

function cookieSecret(): string {
  return (
    process.env.TABLE_QR_HMAC_SECRET ||
    process.env.MEMBER_PASS_HMAC_SECRET ||
    "maitab-session-dev-secret"
  );
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

async function hmacB64url(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cookieSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Buffer.from(sig).toString("base64url");
}

/** Long-lived signed permanent guest id cookie (Layer 1). */
export async function mintCustomerUidCookie(
  guestId: string,
  ttlSeconds = 60 * 60 * 24 * 365
): Promise<string> {
  const body = b64url(
    JSON.stringify({
      uid: guestId,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  );
  const sig = await hmacB64url(body);
  return `${body}.${sig}`;
}

export async function verifyCustomerUidCookie(
  token: string | undefined | null
): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmacB64url(body);
  if (expected !== sig) return null;
  try {
    const parsed = JSON.parse(fromB64url(body)) as {
      uid?: string;
      exp?: number;
    };
    if (!parsed.uid || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

export function applyCustomerUidCookie(
  response: NextResponse,
  token: string
) {
  response.cookies.set(
    CUSTOMER_UID_COOKIE,
    token,
    secureCookieOptions(60 * 60 * 24 * 365)
  );
}
