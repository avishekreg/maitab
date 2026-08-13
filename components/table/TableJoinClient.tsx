"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { AttachSessionResult } from "@/lib/data/sessions";

export function TableJoinClient({
  token,
  tableCodeHint,
}: {
  token: string;
  tableCodeHint: string;
}) {
  const [result, setResult] = useState<AttachSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
  }, [token]);

  if (error && !result?.ok) {
    return (
      <GlassPanel className="p-6">
        <h1 className="font-display text-2xl font-bold text-accent-ruby">
          Session attach failed
        </h1>
        <p className="mt-2 text-sm text-nightlife-muted">{error}</p>
        <p className="mt-2 text-xs text-nightlife-muted">
          Scanned hint: {tableCodeHint}
        </p>
      </GlassPanel>
    );
  }

  if (!result) {
    return (
      <GlassPanel className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-nightlife-muted">
          HMAC verified
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          Attaching {tableCodeHint}…
        </h1>
        <p className="mt-2 text-sm text-nightlife-muted">
          Resolving parent table and upserting active_sessions.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6" glow="violet">
      <p className="text-xs uppercase tracking-[0.2em] text-nightlife-muted">
        HMAC verified · {result.mode} session
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">
        Scanned {result.scannedTableCode}
      </h1>
      <p className="mt-2 text-sm text-nightlife-muted">
        {result.scannedTableCode === result.primaryTableCode
          ? result.created
            ? "Opened primary host session on active_sessions."
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
