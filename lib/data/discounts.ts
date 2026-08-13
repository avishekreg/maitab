import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultDiscountFor,
  sessionCanUseNativePromos,
} from "@/lib/discounts/bridge";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActiveSession, DiscountStatus, ExternalProvider } from "@/lib/types";

export type DiscountBridgePayload = {
  session_id: string;
  club_id: string;
  table_hint?: string;
  external_provider: ExternalProvider;
  external_voucher_code: string | null;
  discount_percentage: number;
  discount_status: DiscountStatus | null;
  is_native_promos_eligible: boolean;
  discount_verified_by: string | null;
};

function mapSessionRow(row: Record<string, unknown>): ActiveSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    club_id: String(row.club_id),
    primary_table_id: String(row.primary_table_id),
    total_session_spend: Number(row.total_session_spend ?? 0),
    is_lucky_draw_eligible: Boolean(row.is_lucky_draw_eligible),
    is_vip: Boolean(row.is_vip),
    status: row.status as ActiveSession["status"],
    started_at: String(row.started_at),
    ended_at: row.ended_at ? String(row.ended_at) : null,
    external_provider: (row.external_provider as ExternalProvider) ?? "NONE",
    external_voucher_code: row.external_voucher_code
      ? String(row.external_voucher_code)
      : null,
    discount_percentage: Number(row.discount_percentage ?? 0),
    discount_status: (row.discount_status as DiscountStatus | null) ?? null,
    discount_verified_by: row.discount_verified_by
      ? String(row.discount_verified_by)
      : null,
    is_native_promos_eligible:
      row.is_native_promos_eligible === undefined
        ? true
        : Boolean(row.is_native_promos_eligible),
  };
}

function toBridgePayload(session: ActiveSession): DiscountBridgePayload {
  return {
    session_id: session.id,
    club_id: session.club_id,
    external_provider: session.external_provider,
    external_voucher_code: session.external_voucher_code,
    discount_percentage: session.discount_percentage,
    discount_status: session.discount_status,
    is_native_promos_eligible: session.is_native_promos_eligible,
    discount_verified_by: session.discount_verified_by,
  };
}

/** In-memory fallback pending queue for offline demo. */
const fallbackPending = new Map<string, ActiveSession>();

export function getFallbackPendingForClub(clubId: string): ActiveSession[] {
  return Array.from(fallbackPending.values()).filter(
    (s) =>
      s.club_id === clubId && s.discount_status === "PENDING_VERIFICATION"
  );
}

export async function requestExternalDiscount(input: {
  session: ActiveSession;
  provider: Exclude<ExternalProvider, "NONE">;
  voucherCode: string;
  discountPercentage?: number;
}): Promise<{ ok: true; session: ActiveSession; mode: string } | { ok: false; reason: string }> {
  const pct =
    input.discountPercentage ?? defaultDiscountFor(input.provider);
  const code = input.voucherCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "voucher code required" };

  if (!isSupabaseConfigured()) {
    const next: ActiveSession = {
      ...input.session,
      external_provider: input.provider,
      external_voucher_code: code,
      discount_percentage: pct,
      discount_status: "PENDING_VERIFICATION",
      discount_verified_by: null,
      // Conversion hook: native stays open until staff approves
      is_native_promos_eligible: true,
    };
    fallbackPending.set(next.id, next);
    return { ok: true, session: next, mode: "fallback" };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("request_external_discount", {
      p_session_id: input.session.id,
      p_provider: input.provider,
      p_voucher_code: code,
      p_discount_percentage: pct,
    });
    if (error) return { ok: false, reason: error.message };
    const session = mapSessionRow(data as Record<string, unknown>);
    return { ok: true, session, mode: "live" };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "request failed",
    };
  }
}

export async function approveExternalDiscount(input: {
  sessionId: string;
  staffUserId: string;
  discountPercentage?: number;
  fallbackSession?: ActiveSession;
}): Promise<{ ok: true; session: ActiveSession; mode: string } | { ok: false; reason: string }> {
  if (!isSupabaseConfigured()) {
    const current =
      input.fallbackSession ?? fallbackPending.get(input.sessionId);
    if (!current || current.discount_status !== "PENDING_VERIFICATION") {
      return { ok: false, reason: "no pending external discount for session" };
    }
    const next: ActiveSession = {
      ...current,
      discount_status: "APPROVED",
      discount_percentage:
        input.discountPercentage ?? current.discount_percentage,
      discount_verified_by: input.staffUserId,
      is_native_promos_eligible: false,
      is_lucky_draw_eligible: false,
    };
    fallbackPending.set(next.id, next);
    return { ok: true, session: next, mode: "fallback" };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("approve_external_discount", {
      p_session_id: input.sessionId,
      p_staff_user_id: input.staffUserId,
      p_discount_percentage: input.discountPercentage ?? null,
    });
    if (error) return { ok: false, reason: error.message };
    return {
      ok: true,
      session: mapSessionRow(data as Record<string, unknown>),
      mode: "live",
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "approve failed",
    };
  }
}

export async function rejectExternalDiscount(input: {
  sessionId: string;
  staffUserId: string;
  fallbackSession?: ActiveSession;
}): Promise<{ ok: true; session: ActiveSession; mode: string } | { ok: false; reason: string }> {
  if (!isSupabaseConfigured()) {
    const current =
      input.fallbackSession ?? fallbackPending.get(input.sessionId);
    if (!current || current.discount_status !== "PENDING_VERIFICATION") {
      return { ok: false, reason: "no pending external discount for session" };
    }
    const next: ActiveSession = {
      ...current,
      discount_status: "REJECTED",
      discount_verified_by: input.staffUserId,
      external_provider: "NONE",
      external_voucher_code: null,
      discount_percentage: 0,
      is_native_promos_eligible: true,
    };
    fallbackPending.delete(next.id);
    return { ok: true, session: next, mode: "fallback" };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("reject_external_discount", {
      p_session_id: input.sessionId,
      p_staff_user_id: input.staffUserId,
    });
    if (error) return { ok: false, reason: error.message };
    return {
      ok: true,
      session: mapSessionRow(data as Record<string, unknown>),
      mode: "live",
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "reject failed",
    };
  }
}

export async function listPendingDiscountSessions(
  clubId: string
): Promise<ActiveSession[]> {
  if (!isSupabaseConfigured()) {
    return getFallbackPendingForClub(clubId);
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("active_sessions")
      .select("*")
      .eq("club_id", clubId)
      .eq("status", "ACTIVE")
      .eq("discount_status", "PENDING_VERIFICATION")
      .order("started_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => mapSessionRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function assertNativePromoAllowed(
  sessionId: string,
  fallbackSession?: ActiveSession
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isSupabaseConfigured()) {
    if (fallbackSession && !sessionCanUseNativePromos(fallbackSession)) {
      return {
        ok: false,
        reason:
          "External deal is active — native flash promos and lucky draws are locked for this tab.",
      };
    }
    return { ok: true };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc(
      "session_can_use_native_promos",
      { p_session_id: sessionId }
    );
    if (error) return { ok: false, reason: error.message };
    if (!data) {
      return {
        ok: false,
        reason:
          "External deal is active — native flash promos and lucky draws are locked for this tab.",
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "promo check failed",
    };
  }
}

export { toBridgePayload, mapSessionRow };
