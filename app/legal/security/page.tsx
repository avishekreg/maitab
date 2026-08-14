import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Security Disclaimer · mAITab",
};

export default function SecurityDisclaimerPage() {
  return (
    <LegalDoc title="Security Disclaimer" updated="August 2026">
      <p>
        mAITab uses sealed cryptographic table tokens, High-Throughput
        Cryptographic Ledger Member Passes, role isolation, and geo-fenced
        AutoPay controls. No system is perfectly secure; this disclaimer sets
        expectations for operators and guests.
      </p>
      <h2>1. Shared responsibility</h2>
      <p>
        Syncra Systems hardens the application and infrastructure. Venues must
        protect staff credentials, device access, and payment-provider keys, and
        follow operational SOPs on the floor.
      </p>
      <h2>2. Demo environments</h2>
      <p>
        Public demos use shared credentials and synthetic data. Do not enter
        real cardholder data or production secrets into demo roles.
      </p>
      <h2>3. No absolute guarantee</h2>
      <p>
        While we employ industry-standard controls, Syncra Systems does not
        warrant uninterrupted or error-free operation, nor immunity from all
        unauthorized access, outages, or third-party provider failures.
      </p>
      <h2>4. Reporting</h2>
      <p>
        Suspected vulnerabilities:{" "}
        <a className="text-violet-300 hover:text-violet-200" href="mailto:security@syncrasystems.com">
          security@syncrasystems.com
        </a>
        . Please allow reasonable time for remediation before public disclosure.
      </p>
    </LegalDoc>
  );
}
