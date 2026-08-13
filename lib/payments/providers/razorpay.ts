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
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  };
}

function configured() {
  const { keyId, keySecret } = credentials();
  return Boolean(keyId && keySecret && !keyId.includes("your-"));
}

/**
 * Razorpay AutoPay / recurring mandate hooks.
 * When live credentials are absent, delegates to sandbox so local UX still works.
 */
export const razorpayProvider: PaymentProvider = {
  id: "razorpay",

  async triggerMicroHold(req: MicroHoldRequest): Promise<MicroHoldResponse> {
    if (!configured()) {
      const result = await sandboxProvider.triggerMicroHold(req);
      return { ...result, provider: "razorpay", raw: { mode: "sandbox-fallback" } };
    }

    const { keyId, keySecret } = credentials();
    // Create a ₹1–₹10 authorization payment against an existing mandate token.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments/create/recurring", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.metadata?.email ?? "guest@maitab.app",
        contact: req.metadata?.phone ?? "+910000000000",
        amount: Math.round(req.amount * 100),
        currency: req.currency ?? "INR",
        order_id: req.metadata?.orderId,
        customer_id: req.customerId,
        token: req.mandateId,
        recurring: "1",
        notes: {
          purpose: "maitab_micro_hold",
          ...req.metadata,
        },
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      error?: { description?: string };
    };

    if (!res.ok || !data.id) {
      return {
        ok: false,
        provider: "razorpay",
        reason: data.error?.description ?? `Razorpay hold failed (${res.status})`,
        raw: data,
      };
    }

    return {
      ok: true,
      provider: "razorpay",
      holdId: data.id,
      amount: req.amount,
      raw: data,
    };
  },

  async settleSession(req: SettlementRequest): Promise<SettlementResponse> {
    if (!configured()) {
      const result = await sandboxProvider.settleSession(req);
      return { ...result, provider: "razorpay", raw: { mode: "sandbox-fallback" } };
    }

    const { keyId, keySecret } = credentials();
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments/create/recurring", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(req.amount * 100),
        currency: req.currency ?? "INR",
        token: req.mandateId,
        recurring: "1",
        notes: {
          purpose: "maitab_geo_settle",
          session_id: req.sessionId,
          ...req.metadata,
        },
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      error?: { description?: string };
    };

    if (!res.ok || !data.id) {
      return {
        ok: false,
        provider: "razorpay",
        reason: data.error?.description ?? `Razorpay settle failed (${res.status})`,
        raw: data,
      };
    }

    return {
      ok: true,
      provider: "razorpay",
      receiptId: data.id,
      raw: data,
    };
  },

  async verifyWebhook(headers, rawBody) {
    const secret = credentials().webhookSecret;
    if (!secret) {
      return { ok: false, reason: "RAZORPAY_WEBHOOK_SECRET not configured" };
    }
    const signature = headers.get("x-razorpay-signature") ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Invalid Razorpay webhook signature" };
    }
    const payload = JSON.parse(rawBody) as { event?: string };
    return { ok: true, event: payload.event, payload };
  },
};
