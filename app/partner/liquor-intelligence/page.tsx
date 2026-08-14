"use client";

import { BrandLockup } from "@/components/branding/brand-lockup";
import { DarkGlassTelemetry } from "@/components/analytics/dark-glass-telemetry";

export default function LiquorIntelligencePortal() {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLockup />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
            Brand executive portal
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <DarkGlassTelemetry scope="partner" />
      </main>
    </div>
  );
}
