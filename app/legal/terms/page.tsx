import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Usage · mAITab",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Usage" updated="August 2026">
      <p>
        These Terms govern access to and use of the mAITab Nightlife operating
        system, including demo environments, venue consoles, Member Pass, prepaid
        tabs, and related APIs operated by Syncra Systems LLP (“we”, “us”).
      </p>
      <h2>1. Acceptance</h2>
      <p>
        By accessing mAITab you agree to these Terms. If you are accepting on
        behalf of a venue or merchant, you represent that you have authority to
        bind that entity.
      </p>
      <h2>2. Platform scope</h2>
      <p>
        mAITab provides zero-hardware nightlife software for prepaid tabs, gate
        hospitality, bartender KDS, AV recognition, social games, discount
        bridging, and geo-fenced AutoPay settlement. Features may vary by venue
        configuration and integration readiness.
      </p>
      <h2>3. Demo & production use</h2>
      <p>
        Public demo roles are for evaluation only. Production merchants must
        complete onboarding, payment-provider setup, and operational training
        before processing live guest transactions.
      </p>
      <h2>4. Acceptable use</h2>
      <p>
        You will not misuse the platform, attempt unauthorized access, reverse
        engineer protected components, or use mAITab to violate applicable
        payment, privacy, or nightlife regulations in your jurisdiction.
      </p>
      <h2>5. Contact</h2>
      <p>
        Questions:{" "}
        <a className="text-violet-300 hover:text-violet-200" href="mailto:legal@syncrasystems.com">
          legal@syncrasystems.com
        </a>
      </p>
    </LegalDoc>
  );
}
