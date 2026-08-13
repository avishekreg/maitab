import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw =
    process.env.CONFIG_ENCRYPTION_KEY ??
    process.env.TABLE_QR_HMAC_SECRET ??
    "maitab-dev-config-key-change-me";

  return createHash("sha256").update(raw).digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** AES-256-GCM encrypt → `enc:v1:<iv>:<tag>:<cipher>` (base64url parts). */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  if (isEncryptedSecret(plaintext)) return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload) return "";
  if (!isEncryptedSecret(payload)) return payload;

  const body = payload.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");

  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Safe for API responses: decrypt then mask unless reveal=true. */
export function revealOrMaskSecret(
  stored: string,
  reveal: boolean
): { display: string; encrypted: boolean } {
  if (!stored) return { display: "", encrypted: false };
  try {
    const plain = decryptSecret(stored);
    const encrypted = isEncryptedSecret(stored);
    if (!reveal) {
      if (plain.length <= 4) return { display: "••••", encrypted };
      return {
        display: `${"•".repeat(Math.min(12, plain.length - 4))}${plain.slice(-4)}`,
        encrypted,
      };
    }
    return { display: plain, encrypted };
  } catch {
    return { display: "[decrypt-error]", encrypted: true };
  }
}
