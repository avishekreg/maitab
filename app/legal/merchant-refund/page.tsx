import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Merchant Refund & Dispute Policy · mAITab",
};

export default function MerchantRefundPage() {
  return (
    <LegalDoc
      title="Merchant Refund & Dispute Policy"
      updated="August 2026"
    >
      <p>
        This policy describes how Syncra Systems LLP and participating merchants
        handle refunds, chargebacks, and AutoPay disputes initiated through
        mAITab sessions.
      </p>
      <h2>1. Merchant of record</h2>
      <p>
        The venue remains merchant of record for guest spend unless a written
        agreement states otherwise. Refund authority sits with the venue
        operator and their payment provider configuration.
      </p>
      <h2>2. In-session adjustments</h2>
      <p>
        Bartender KDS, Club Admin, and approved discount-bridge flows may adjust
        ticket totals before settlement. Once AutoPay closes a geo-fenced
        session, subsequent refunds follow the provider’s refund APIs and venue
        SOP.
      </p>
      <h2>3. Guest disputes</h2>
      <p>
        Guests should first contact the venue. If unresolved, disputes may be
        escalated through the payment network. Syncra Systems LLP will provide
        session logs, token hashes, and settlement timestamps to support
        investigation.
      </p>
      <h2>4. Platform fees</h2>
      <p>
        Platform subscription or usage fees are non-refundable except where
        required by law or an explicit enterprise agreement.
      </p>
    </LegalDoc>
  );
}
