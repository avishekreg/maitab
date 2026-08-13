import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildHandshakeRecord,
  handshakeIntegrityHash,
  recordHandshakeMemory,
} from "@/lib/kds/handshake";
import { isSupabaseConfigured, NEON_CLUB_ID } from "@/lib/supabase/env";
import type { Order } from "@/lib/types";
import { publishBus } from "@/lib/realtime/bus";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    tokenNumber?: number;
    bartenderId?: string;
    waiterId?: string | null;
    tableId?: string | null;
    deviceFingerprint?: string;
  };

  if (!body.orderId) {
    return NextResponse.json(
      { ok: false, error: "orderId required" },
      { status: 400 }
    );
  }

  const fingerprint =
    body.deviceFingerprint ||
    request.headers.get("x-maitab-device") ||
    "server-kds";

  const bartenderId = body.bartenderId || "bartender-demo";

  // Prefer live Supabase when configured
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", body.orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const record = buildHandshakeRecord({
      order: order as Order,
      bartenderId,
      waiterId: body.waiterId,
      tableId: body.tableId,
      deviceFingerprint: fingerprint,
    });
    const integrity = handshakeIntegrityHash(record);

    await admin.from("order_handshakes").insert({
      order_id: record.order_id,
      club_id: record.club_id,
      token_code: record.token_code,
      bartender_id: null,
      waiter_id: null,
      table_id: body.tableId ?? null,
      timestamp_ms: record.timestamp_ms,
      device_fingerprint: record.device_fingerprint,
      integrity_hash: integrity,
    });

    const { data: updated } = await admin
      .from("orders")
      .update({ status: "RELEASED" })
      .eq("id", body.orderId)
      .select("*")
      .maybeSingle();

    publishBus("orders", "UPDATE", {
      id: body.orderId,
      status: "RELEASED",
      token_number: (order as Order).token_number,
      session_id: (order as Order).session_id,
    });

    return NextResponse.json({
      ok: true,
      handshake: { ...record, integrity_hash: integrity },
      order: updated,
    });
  }

  // Demo / offline memory path
  const demoOrder: Order = {
    id: body.orderId,
    session_id: "demo",
    club_id: NEON_CLUB_ID,
    items: [],
    total_amount: 0,
    status: "READY",
    token_number: body.tokenNumber ?? 4829,
    created_at: new Date().toISOString(),
    ready_at: new Date().toISOString(),
  };

  const record = buildHandshakeRecord({
    order: demoOrder,
    bartenderId,
    waiterId: body.waiterId,
    tableId: body.tableId,
    deviceFingerprint: fingerprint,
  });
  recordHandshakeMemory(record);

  publishBus("orders", "UPDATE", {
    id: body.orderId,
    status: "RELEASED",
    token_number: demoOrder.token_number,
    session_id: demoOrder.session_id,
  });

  return NextResponse.json({
    ok: true,
    handshake: {
      ...record,
      integrity_hash: handshakeIntegrityHash(record),
    },
    order: { ...demoOrder, status: "RELEASED" },
    mode: "memory",
  });
}
