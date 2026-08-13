import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.TABLE_QR_HMAC_SECRET;
  if (!secret) {
    throw new Error("TABLE_QR_HMAC_SECRET is not configured");
  }
  return secret;
}

export interface TableQrPayload {
  clubId: string;
  tableId: string;
  tableCode: string;
  exp: number;
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

export function signTableToken(
  payload: Omit<TableQrPayload, "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const body: TableQrPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = encodeBase64Url(JSON.stringify(body));
  const signature = createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyTableToken(token: string): TableQrPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encoded).toString("utf8")
    ) as TableQrPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildTableScanPath(token: string): string {
  return `/t/${token}`;
}
