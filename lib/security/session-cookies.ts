import type { NextResponse } from "next/server";

export const DEMO_ROLE_COOKIE = "maitab_demo_role";
export const DEVICE_BIND_COOKIE = "maitab_device_bind";

function cookieSecret(): string {
  return (
    process.env.TABLE_QR_HMAC_SECRET ||
    process.env.MEMBER_PASS_HMAC_SECRET ||
    "maitab-session-dev-secret"
  );
}

export function secureCookieOptions(maxAgeSeconds: number) {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  return {
    path: "/",
    maxAge: maxAgeSeconds,
    httpOnly: true,
    // Lax so Google OAuth redirect round-trips keep role cookies.
    sameSite: "lax" as const,
    secure,
  };
}

export interface DeviceBindPayload {
  fp: string;
  uaHash: string;
  exp: number;
}

function b64url(bytes: ArrayBuffer | Uint8Array | string): string {
  const u8 =
    typeof bytes === "string"
      ? new TextEncoder().encode(bytes)
      : bytes instanceof Uint8Array
        ? bytes
        : new Uint8Array(bytes);
  let bin = "";
  u8.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacHex(message: string): Promise<string> {
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
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  return b64url(sig);
}

export async function hashUserAgent(ua: string | null): Promise<string> {
  const hex = await hmacHex(ua || "unknown");
  return hex.slice(0, 32);
}

export function mintDeviceFingerprint(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signDeviceBind(
  payload: Omit<DeviceBindPayload, "exp">,
  ttlSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const body: DeviceBindPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = b64url(JSON.stringify(body));
  const sig = await hmacB64url(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyDeviceBind(
  token: string | undefined | null
): Promise<DeviceBindPayload | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = await hmacB64url(encoded);
  if (signature.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i += 1) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return null;
  try {
    const json = new TextDecoder().decode(fromB64url(encoded));
    const payload = JSON.parse(json) as DeviceBindPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function applyAuthCookies(
  response: NextResponse,
  role: string,
  opts?: { fingerprint?: string; userAgent?: string | null }
) {
  const fp = opts?.fingerprint || mintDeviceFingerprint();
  const bind = await signDeviceBind({
    fp,
    uaHash: await hashUserAgent(opts?.userAgent ?? null),
  });
  const cookieOpts = secureCookieOptions(60 * 60 * 24 * 7);
  response.cookies.set(DEMO_ROLE_COOKIE, role, cookieOpts);
  response.cookies.set(DEVICE_BIND_COOKIE, bind, cookieOpts);
  return { fingerprint: fp };
}

export function clearAuthCookies(response: NextResponse) {
  const opts = secureCookieOptions(0);
  response.cookies.set(DEMO_ROLE_COOKIE, "", { ...opts, maxAge: 0 });
  response.cookies.set(DEVICE_BIND_COOKIE, "", { ...opts, maxAge: 0 });
}

export const FORBIDDEN_PAGE_QUERY_KEYS = [
  "table",
  "table_id",
  "order",
  "order_id",
  "waiter",
  "waiter_id",
  "session",
  "session_id",
  "user",
  "user_id",
  "club",
  "club_id",
] as const;

export function hasForbiddenPageQuery(
  searchParams: URLSearchParams
): string | null {
  const keys = Array.from(searchParams.keys());
  for (const key of keys) {
    if (
      (FORBIDDEN_PAGE_QUERY_KEYS as readonly string[]).includes(
        key.toLowerCase()
      )
    ) {
      return key;
    }
  }
  return null;
}
