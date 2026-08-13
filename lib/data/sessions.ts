import { DEMO_SESSION, DEMO_TABLES } from "@/lib/demo/data";
import type { TableQrPayload } from "@/lib/qr/hmac";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEMO_CUSTOMER_ID,
  isSupabaseConfigured,
  TABLE_B4_ID,
} from "@/lib/supabase/env";

export interface AttachSessionResult {
  ok: boolean;
  mode: "live" | "fallback";
  reason?: string;
  sessionId: string;
  userId: string;
  clubId: string;
  scannedTableId: string;
  scannedTableCode: string;
  primaryTableId: string;
  primaryTableCode: string;
  created: boolean;
}

/**
 * After HMAC table-token verification: resolve merged parent and
 * upsert/join an `active_sessions` row (or demo fallback).
 */
export async function attachSessionFromTableScan(params: {
  payload: TableQrPayload;
  userId?: string | null;
}): Promise<AttachSessionResult> {
  const userId = params.userId || DEMO_CUSTOMER_ID;
  const { payload } = params;

  if (!isSupabaseConfigured()) {
    return attachFallback(payload, userId);
  }

  try {
    const supabase = createAdminClient();

    const { data: scanned, error: tableErr } = await supabase
      .from("club_tables")
      .select("id, club_id, table_code, status, parent_table_id")
      .eq("id", payload.tableId)
      .maybeSingle();

    if (tableErr || !scanned) {
      // Try by code within club from token.
      const { data: byCode } = await supabase
        .from("club_tables")
        .select("id, club_id, table_code, status, parent_table_id")
        .eq("club_id", payload.clubId)
        .eq("table_code", payload.tableCode)
        .maybeSingle();

      if (!byCode) {
        return {
          ...attachFallback(payload, userId),
          ok: false,
          reason: "Table not found in live database",
        };
      }
      return attachLive(supabase, byCode, userId);
    }

    return attachLive(supabase, scanned, userId);
  } catch (err) {
    return {
      ...attachFallback(payload, userId),
      ok: false,
      reason: err instanceof Error ? err.message : "Attach failed",
    };
  }
}

async function attachLive(
  supabase: ReturnType<typeof createAdminClient>,
  scanned: {
    id: string;
    club_id: string;
    table_code: string;
    status: string;
    parent_table_id: string | null;
  },
  userId: string
): Promise<AttachSessionResult> {
  const { data: resolvedPrimary } = await supabase.rpc("resolve_primary_table", {
    p_table_id: scanned.id,
  });

  const primaryTableId =
    (resolvedPrimary as string | null) ??
    (scanned.status === "MERGED_CHILD" && scanned.parent_table_id
      ? scanned.parent_table_id
      : scanned.id);

  const { data: primary } = await supabase
    .from("club_tables")
    .select("id, table_code, club_id")
    .eq("id", primaryTableId)
    .single();

  if (!primary) {
    return {
      ok: false,
      mode: "live",
      reason: "Primary table unresolved",
      sessionId: DEMO_SESSION.id,
      userId,
      clubId: scanned.club_id,
      scannedTableId: scanned.id,
      scannedTableCode: scanned.table_code,
      primaryTableId,
      primaryTableCode: scanned.table_code,
      created: false,
    };
  }

  // Prefer an existing ACTIVE session on the primary table.
  const { data: existing } = await supabase
    .from("active_sessions")
    .select("id, user_id")
    .eq("primary_table_id", primary.id)
    .eq("status", "ACTIVE")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("club_tables")
      .update({ status: scanned.status === "MERGED_CHILD" ? "MERGED_CHILD" : "OCCUPIED" })
      .eq("id", scanned.id)
      .in("status", ["AVAILABLE"]);

    return {
      ok: true,
      mode: "live",
      sessionId: existing.id,
      userId: existing.user_id,
      clubId: primary.club_id,
      scannedTableId: scanned.id,
      scannedTableCode: scanned.table_code,
      primaryTableId: primary.id,
      primaryTableCode: primary.table_code,
      created: false,
    };
  }

  const { data: created, error } = await supabase
    .from("active_sessions")
    .insert({
      user_id: userId,
      club_id: primary.club_id,
      primary_table_id: primary.id,
      status: "ACTIVE",
      total_session_spend: 0,
    })
    .select("id")
    .single();

  if (error || !created) {
    return {
      ok: false,
      mode: "live",
      reason: error?.message ?? "Failed to create session",
      sessionId: DEMO_SESSION.id,
      userId,
      clubId: primary.club_id,
      scannedTableId: scanned.id,
      scannedTableCode: scanned.table_code,
      primaryTableId: primary.id,
      primaryTableCode: primary.table_code,
      created: false,
    };
  }

  await supabase
    .from("club_tables")
    .update({
      status:
        scanned.status === "MERGED_CHILD" || scanned.status === "MERGED_PARENT"
          ? scanned.status
          : "OCCUPIED",
    })
    .eq("id", primary.id);

  return {
    ok: true,
    mode: "live",
    sessionId: created.id,
    userId,
    clubId: primary.club_id,
    scannedTableId: scanned.id,
    scannedTableCode: scanned.table_code,
    primaryTableId: primary.id,
    primaryTableCode: primary.table_code,
    created: true,
  };
}

function attachFallback(
  payload: TableQrPayload,
  userId: string
): AttachSessionResult {
  const scanned =
    DEMO_TABLES.find((t) => t.id === payload.tableId) ??
    DEMO_TABLES.find((t) => t.table_code === payload.tableCode);

  const primaryId =
    scanned?.status === "MERGED_CHILD" && scanned.parent_table_id
      ? scanned.parent_table_id
      : scanned?.id ?? payload.tableId;

  const primary =
    DEMO_TABLES.find((t) => t.id === primaryId) ??
    (primaryId === TABLE_B4_ID
      ? { id: TABLE_B4_ID, table_code: "B4", club_id: payload.clubId }
      : null);

  return {
    ok: Boolean(scanned && primary),
    mode: "fallback",
    reason: scanned && primary ? undefined : "Demo table not found",
    sessionId: DEMO_SESSION.id,
    userId,
    clubId: payload.clubId,
    scannedTableId: scanned?.id ?? payload.tableId,
    scannedTableCode: scanned?.table_code ?? payload.tableCode,
    primaryTableId: primary?.id ?? primaryId,
    primaryTableCode: primary?.table_code ?? payload.tableCode,
    created: false,
  };
}
