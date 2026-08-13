import { createHmac } from "crypto";
import type { Order } from "@/lib/types";
import { formatTokenDisplay } from "@/lib/kds/token";

export { generateOrderTokenCode, formatTokenDisplay } from "@/lib/kds/token";

export interface OrderHandshakeRecord {
  id: string;
  order_id: string;
  token_code: string;
  bartender_id: string;
  waiter_id: string | null;
  table_id: string | null;
  timestamp_ms: number;
  device_fingerprint: string;
  club_id: string;
}

export function buildHandshakeRecord(input: {
  order: Order;
  bartenderId: string;
  waiterId?: string | null;
  tableId?: string | null;
  deviceFingerprint: string;
}): OrderHandshakeRecord {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `hs-${crypto.randomUUID()}`
      : `hs-${Date.now()}`;

  return {
    id,
    order_id: input.order.id,
    token_code: formatTokenDisplay(input.order.token_number),
    bartender_id: input.bartenderId,
    waiter_id: input.waiterId ?? null,
    table_id: input.tableId ?? null,
    timestamp_ms: Date.now(),
    device_fingerprint: input.deviceFingerprint,
    club_id: input.order.club_id,
  };
}

const MEMORY_HANDSHAKES: OrderHandshakeRecord[] = [];

export function recordHandshakeMemory(
  record: OrderHandshakeRecord
): OrderHandshakeRecord {
  MEMORY_HANDSHAKES.unshift(record);
  if (MEMORY_HANDSHAKES.length > 200) MEMORY_HANDSHAKES.pop();
  return record;
}

export function listHandshakeMemory(clubId?: string): OrderHandshakeRecord[] {
  if (!clubId) return [...MEMORY_HANDSHAKES];
  return MEMORY_HANDSHAKES.filter((h) => h.club_id === clubId);
}

export function handshakeIntegrityHash(record: OrderHandshakeRecord): string {
  const secret =
    process.env.TABLE_QR_HMAC_SECRET ||
    process.env.MEMBER_PASS_HMAC_SECRET ||
    "maitab-handshake-dev";
  return createHmac("sha256", secret)
    .update(
      `${record.order_id}:${record.token_code}:${record.timestamp_ms}:${record.device_fingerprint}`
    )
    .digest("hex");
}
