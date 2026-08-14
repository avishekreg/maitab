import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy · mAITab",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="August 2026">
      <p>
        Syncra Systems LLP processes personal and operational data to run mAITab —
        Member Pass verification, prepaid sessions, order tickets, game events,
        and AutoPay settlement for participating venues.
      </p>
      <h2>1. Data we process</h2>
      <p>
        Depending on role and venue setup, this may include guest identifiers,
        spend-tier signals, favorite drinks, table/session tokens, order
        payloads, gate scan events, device/geo signals used for settlement
        fencing, and merchant admin account details.
      </p>
      <h2>2. Purpose</h2>
      <p>
        Data is used to authenticate passes, operate tabs and KDS, prevent fraud,
        settle AutoPay mandates, improve venue operations, and meet legal or
        payment-network obligations.
      </p>
      <h2>3. Sharing</h2>
      <p>
        We share data with the hosting venue, payment processors, and
        infrastructure providers strictly as needed to deliver the service. We
        do not sell guest personal data.
      </p>
      <h2>4. Retention & rights</h2>
      <p>
        Retention follows merchant contracts and applicable law. Guests and
        merchants may request access or deletion where legally required by
        contacting{" "}
        <a className="text-violet-300 hover:text-violet-200" href="mailto:privacy@syncrasystems.com">
          privacy@syncrasystems.com
        </a>
        .
      </p>
    </LegalDoc>
  );
}
