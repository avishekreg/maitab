import { cashfreeProvider } from "@/lib/payments/providers/cashfree";
import { razorpayProvider } from "@/lib/payments/providers/razorpay";
import { sandboxProvider } from "@/lib/payments/providers/sandbox";
import type {
  PaymentProvider,
  PaymentProviderId,
} from "@/lib/payments/providers/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type MicroHoldResult =
  | { ok: true; holdId: string; amount: number; provider: PaymentProviderId }
  | { ok: false; reason: string; provider: PaymentProviderId };

export type SettleResult = {
  ok: boolean;
  receiptId?: string;
  reason?: string;
  provider: PaymentProviderId;
  mode?: "edge" | "provider" | "sandbox";
};

function activeProvider(): PaymentProvider {
  const pref = (process.env.PAYMENT_PROVIDER ?? "sandbox").toLowerCase();
  if (pref === "razorpay") return razorpayProvider;
  if (pref === "cashfree") return cashfreeProvider;
  if (pref === "sandbox") return sandboxProvider;
  // Auto: prefer razorpay credentials, then cashfree, else sandbox.
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return razorpayProvider;
  }
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    return cashfreeProvider;
  }
  return sandboxProvider;
}

export function getPaymentProvider(): PaymentProvider {
  return activeProvider();
}

/**
 * Payment-gateway adapter for AutoPay micro-holds.
 * Extensible via PAYMENT_PROVIDER=razorpay|cashfree|sandbox.
 */
export async function triggerMicroHold(
  mandateId: string,
  amount = Number(process.env.PAYMENT_GATEWAY_MICRO_HOLD_AMOUNT ?? 1),
  extras?: { customerId?: string; metadata?: Record<string, string> }
): Promise<MicroHoldResult> {
  const provider = activeProvider();
  const result = await provider.triggerMicroHold({
    mandateId,
    amount,
    customerId: extras?.customerId,
    metadata: extras?.metadata,
  });

  if (!result.ok || !result.holdId) {
    return {
      ok: false,
      reason: result.reason ?? "Micro-hold failed",
      provider: result.provider,
    };
  }

  return {
    ok: true,
    holdId: result.holdId,
    amount: result.amount ?? amount,
    provider: result.provider,
  };
}

/**
 * Settle a session tab via the active provider, then (when live) invoke
 * the Supabase `geo-auto-settle` Edge Function to mark the session settled.
 */
export async function settleSessionTab(params: {
  mandateId: string;
  sessionId: string;
  amount: number;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
}): Promise<SettleResult> {
  const provider = activeProvider();

  // Prefer Edge Function pipeline when Supabase is configured.
  if (isSupabaseConfigured()) {
    const edge = await invokeGeoAutoSettle(params);
    if (edge.ok) {
      return { ...edge, provider: provider.id, mode: "edge" };
    }
    // Fall through to direct provider charge if edge unavailable.
  }

  const result = await provider.settleSession({
    mandateId: params.mandateId,
    sessionId: params.sessionId,
    amount: params.amount,
    metadata: {
      lat: params.lat != null ? String(params.lat) : "",
      lng: params.lng != null ? String(params.lng) : "",
      distance_m:
        params.distanceMeters != null ? String(params.distanceMeters) : "",
    },
  });

  return {
    ok: result.ok,
    receiptId: result.receiptId,
    reason: result.reason,
    provider: result.provider,
    mode: result.provider === "sandbox" ? "sandbox" : "provider",
  };
}

export async function invokeGeoAutoSettle(params: {
  mandateId: string;
  sessionId: string;
  amount: number;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
}): Promise<{ ok: boolean; receiptId?: string; reason?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || key.includes("your-service")) {
    return { ok: false, reason: "Edge Function credentials missing" };
  }

  try {
    const res = await fetch(`${base}/functions/v1/geo-auto-settle`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: params.sessionId,
        mandateId: params.mandateId,
        amount: params.amount,
        lat: params.lat,
        lng: params.lng,
        distanceMeters: params.distanceMeters,
      }),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      receiptId?: string;
      error?: string;
    };

    if (!res.ok || data.error) {
      return { ok: false, reason: data.error ?? `Edge settle failed (${res.status})` };
    }

    return {
      ok: true,
      receiptId: data.receiptId,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Edge settle unreachable",
    };
  }
}
