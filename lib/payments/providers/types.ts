export type PaymentProviderId = "razorpay" | "cashfree" | "sandbox";

export interface MicroHoldRequest {
  mandateId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface MicroHoldResponse {
  ok: boolean;
  provider: PaymentProviderId;
  holdId?: string;
  amount?: number;
  reason?: string;
  raw?: unknown;
}

export interface SettlementRequest {
  mandateId: string;
  sessionId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface SettlementResponse {
  ok: boolean;
  provider: PaymentProviderId;
  receiptId?: string;
  reason?: string;
  raw?: unknown;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  triggerMicroHold(req: MicroHoldRequest): Promise<MicroHoldResponse>;
  settleSession(req: SettlementRequest): Promise<SettlementResponse>;
  verifyWebhook?(
    headers: Headers,
    rawBody: string
  ): Promise<{ ok: boolean; event?: string; payload?: unknown; reason?: string }>;
}
