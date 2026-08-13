import { createHmac, timingSafeEqual } from "crypto";
import type { SpendTier } from "@/lib/types";

const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

export interface MemberPassPayload {
  type: "MAITAB_MEMBER_PASS";
  v: 1;
  userId: string;
  name: string;
  tier: SpendTier;
  mandate: string | null;
  visits?: number;
  exp: number;
}

function getSecret(): string {
  const secret =
    process.env.MEMBER_PASS_HMAC_SECRET ?? process.env.TABLE_QR_HMAC_SECRET;
  if (!secret || secret.includes("replace-with")) {
    throw new Error("MEMBER_PASS_HMAC_SECRET / TABLE_QR_HMAC_SECRET not configured");
  }
  return secret;
}

function encodeBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

export function signMemberPass(
  payload: Omit<MemberPassPayload, "type" | "v" | "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const body: MemberPassPayload = {
    type: "MAITAB_MEMBER_PASS",
    v: 1,
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = encodeBase64Url(JSON.stringify(body));
  const signature = createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyMemberPass(token: string): MemberPassPayload | null {
  // Accept legacy unsigned JSON for demo camera tests only when explicitly prefixed.
  if (token.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(token) as MemberPassPayload;
      if (parsed?.type === "MAITAB_MEMBER_PASS" && parsed.userId) {
        return {
          type: "MAITAB_MEMBER_PASS",
          v: 1,
          userId: parsed.userId,
          name: parsed.name,
          tier: parsed.tier,
          mandate: parsed.mandate ?? null,
          visits: parsed.visits,
          exp: parsed.exp ?? Math.floor(Date.now() / 1000) + 60,
        };
      }
    } catch {
      return null;
    }
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let expected: string;
  try {
    expected = createHmac("sha256", getSecret())
      .update(encoded)
      .digest("base64url");
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encoded).toString("utf8")
    ) as MemberPassPayload;
    if (payload.type !== "MAITAB_MEMBER_PASS") return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
