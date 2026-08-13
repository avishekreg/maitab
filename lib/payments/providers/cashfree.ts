import { createHmac, timingSafeEqual } from "crypto";
import type {
  MicroHoldRequest,
  MicroHoldResponse,
  PaymentProvider,
  SettlementRequest,
  SettlementResponse,
} from "./types";
import { sandboxProvider } from "./sandbox";

function credentials() {
  return {
    appId: process.env.CASHFREE_APP_ID ?? "",
    secret: process.env.CASHFREE_SECRET_KEY ?? "",
    env: process.env.CASHFREE_ENV === "prod" ? "prod" : "sandbox",
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET ?? "",
  };
}

function configured() {
  const { appId, secret } = credentials();
  return Boolean(appId && secret && !appId.includes("your-"));
}

function baseUrl() {
  return credentials().env === "prod"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

/**
 * Cashfree Autopay / subscription mandate hooks with sandbox fallback.
 */
export const cashfreeProvider: PaymentProvider = {
  id: "cashfree",

  async triggerMicroHold(req: MicroHoldRequest): Promise<MicroHoldResponse> {
    if (!configured()) {
      const result = await sandboxProvider.triggerMicroHold(req);
      return { ...result, provider: "cashfree", raw: { mode: "sandbox-fallback" } };
    }

    const { appId, secret } = credentials();
    const res = await fetch(`${baseUrl()}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_amount: req.amount,
        order_currency: req.currency ?? "INR",
        order_id: `hold_${Date.now()}`,
        customer_details: {
          customer_id: req.customerId ?? "maitab_guest",
          customer_phone: req.metadata?.phone ?? "9999999999",
        },
        order_meta: {
          notify_url: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhooks/cashfree`
            : undefined,
        },
        order_tags: {
          purpose: "maitab_micro_hold",
          mandate_id: req.mandateId,
        },
      }),
    });

    const data = (await res.json()) as {
      cf_order_id?: string;
      order_id?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        provider: "cashfree",
        reason: data.message ?? `Cashfree hold failed (${res.status})`,
        raw: data,
      };
    }

    return {
      ok: true,
      provider: "cashfree",
      holdId: data.cf_order_id ?? data.order_id,
      amount: req.amount,
      raw: data,
    };
  },

  async settleSession(req: SettlementRequest): Promise<SettlementResponse> {
    if (!configured()) {
      const result = await sandboxProvider.settleSession(req);
      return { ...result, provider: "cashfree", raw: { mode: "sandbox-fallback" } };
    }

    const { appId, secret } = credentials();
    const res = await fetch(`${baseUrl()}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secret,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_amount: req.amount,
        order_currency: req.currency ?? "INR",
        order_id: `settle_${req.sessionId.slice(0, 8)}_${Date.now()}`,
        customer_details: {
          customer_id: req.metadata?.customerId ?? "maitab_guest",
          customer_phone: req.metadata?.phone ?? "9999999999",
        },
        order_tags: {
          purpose: "maitab_geo_settle",
          session_id: req.sessionId,
          mandate_id: req.mandateId,
        },
      }),
    });

    const data = (await res.json()) as {
      cf_order_id?: string;
      order_id?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        provider: "cashfree",
        reason: data.message ?? `Cashfree settle failed (${res.status})`,
        raw: data,
      };
    }

    return {
      ok: true,
      provider: "cashfree",
      receiptId: data.cf_order_id ?? data.order_id,
      raw: data,
    };
  },

  async verifyWebhook(headers, rawBody) {
    const secret = credentials().webhookSecret || credentials().secret;
    if (!secret) {
      return { ok: false, reason: "Cashfree webhook secret not configured" };
    }
    const signature = headers.get("x-webhook-signature") ?? "";
    const timestamp = headers.get("x-webhook-timestamp") ?? "";
    const signed = createHmac("sha256", secret)
      .update(timestamp + rawBody)
      .digest("base64");
    const a = Buffer.from(signature);
    const b = Buffer.from(signed);
    if (!signature || a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Invalid Cashfree webhook signature" };
    }
    const payload = JSON.parse(rawBody) as { type?: string };
    return { ok: true, event: payload.type, payload };
  },
};
