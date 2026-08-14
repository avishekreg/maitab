"use client";

import { useEffect, useState } from "react";
import {
  COMPLIANCE_BANNER,
  type ComplianceStatus,
} from "@/lib/compliance/watchdog";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  className?: string;
}

export function ComplianceBanner({ venueId, className }: Props) {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/ops/compliance?venueId=${encodeURIComponent(venueId)}`)
      .then((r) => r.json())
      .then(
        (data: {
          compliance?: { compliance_status: ComplianceStatus };
          banner?: string | null;
          warning?: string | null;
        }) => {
          if (cancelled) return;
          const s = data.compliance?.compliance_status ?? null;
          setStatus(s);
          if (s === "SUSPENDED") setMessage(data.banner ?? COMPLIANCE_BANNER);
          else if (s === "WARNING") setMessage(data.warning ?? null);
          else setMessage(null);
        }
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  if (!message || !status) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        status === "SUSPENDED"
          ? "border-accent-ruby/40 bg-accent-ruby/10 text-accent-ruby"
          : "border-amber-400/40 bg-amber-400/10 text-amber-200",
        className
      )}
    >
      {message}
    </div>
  );
}

export function useOrderingFrozen(venueId: string) {
  const [frozen, setFrozen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/ops/compliance?venueId=${encodeURIComponent(venueId)}`)
      .then((r) => r.json())
      .then((data: { frozen?: boolean }) => {
        if (!cancelled) setFrozen(Boolean(data.frozen));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [venueId]);
  return frozen;
}
