"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ShadowChat } from "@/components/cloak/ShadowChat";

function CloakLoading() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-8 text-center text-sm text-zinc-500">
      Opening shadow lounge…
    </div>
  );
}

export default function CloakPage() {
  return (
    <AppShell title="mAI Cloak">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/tab"
          className="font-mono text-xs text-zinc-500 transition hover:text-zinc-200"
        >
          ← Back to Tab
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          Zero-leakage shadow chat
        </p>
      </div>
      <Suspense fallback={<CloakLoading />}>
        <ShadowChat />
      </Suspense>
    </AppShell>
  );
}
