"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ComplianceBanner,
  useOrderingFrozen,
} from "@/components/compliance/ComplianceBanner";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { AttachSessionResult } from "@/lib/data/sessions";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

export function TableJoinClient({
  token,
  tableCodeHint,
}: {
  token: string;
  tableCodeHint: string;
}) {
  const [result, setResult] = useState<AttachSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frozen = useOrderingFrozen(NEON_CLUB_ID);

  useEffect(() => {
    let cancelled = false;
    if (frozen) return;
    void fetch("/api/sessions/attach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = (await res.json()) as AttachSessionResult & {
          reason?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setError(data.reason ?? "Session attach failed");
          if (data.sessionId) setResult(data);
          return;
        }
        setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError("Network error attaching session");
      });
    return () => {
      cancelled = true;
    };
  }, [token, frozen]);

  if (frozen) {
    return (
      <GlassPanel className="p-6">
        <ComplianceBanner venueId={NEON_CLUB_ID} />
        <h1 className="mt-4 font-display text-2xl font-bold text-accent-ruby">
          Check-in frozen
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guest table check-ins are locked until licenses are renewed. Admin
          login remains available.
        </p>
      </GlassPanel>
    );
  }

  if (error && !result?.ok) {
    return (
      <GlassPanel className="p-6">
        <h1 className="font-display text-2xl font-bold text-accent-ruby">
          Session attach failed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Scanned hint: {tableCodeHint}
        </p>
      </GlassPanel>
    );
  }

  if (!result) {
    return (
      <GlassPanel className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Cryptographic seal verified
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
          Attaching {tableCodeHint}…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resolving parent table and opening the live floor session.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6" glow="violet">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Cryptographic seal verified · {result.mode} session
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        Scanned {result.scannedTableCode}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.scannedTableCode === result.primaryTableCode
          ? result.created
            ? "Opened primary host session."
            : "Joined primary host session."
          : `Child table routed to primary host session ${result.primaryTableCode}.`}
      </p>
      <p className="mt-3 text-sm text-accent-emerald">
        Session {result.sessionId.slice(0, 8)}… · prepaid ordering unlocked.
      </p>
      <Link
        href={`/tab?session=${encodeURIComponent(result.sessionId)}`}
        className="mt-5 inline-flex rounded-xl bg-accent-violet px-4 py-3 text-sm font-semibold text-white shadow-glow-violet"
      >
        Open Tab
      </Link>
    </GlassPanel>
  );
}
