import type {
  MicroHoldRequest,
  MicroHoldResponse,
  PaymentProvider,
  SettlementRequest,
  SettlementResponse,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const sandboxProvider: PaymentProvider = {
  id: "sandbox",

  async triggerMicroHold(req: MicroHoldRequest): Promise<MicroHoldResponse> {
    await delay(350);
    if (!req.mandateId) {
      return { ok: false, provider: "sandbox", reason: "Missing AutoPay mandate" };
    }
    if (req.mandateId.includes("fail")) {
      return {
        ok: false,
        provider: "sandbox",
        reason: "Insufficient balance / mandate failed",
      };
    }
    return {
      ok: true,
      provider: "sandbox",
      holdId: `sandbox_hold_${Date.now()}`,
      amount: req.amount,
    };
  },

  async settleSession(req: SettlementRequest): Promise<SettlementResponse> {
    await delay(450);
    if (!req.mandateId) {
      return { ok: false, provider: "sandbox", reason: "Missing AutoPay mandate" };
    }
    return {
      ok: true,
      provider: "sandbox",
      receiptId: `rcpt_${req.sessionId.slice(0, 8)}_${Date.now()}`,
    };
  },
};
