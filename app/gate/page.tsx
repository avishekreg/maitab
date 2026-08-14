"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ShieldCheck, UserRound } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { DEMO_CUSTOMER, DEMO_GATE_EVENTS } from "@/lib/demo/data";
import { emitGateEntry, fetchRecentGateEvents } from "@/lib/data/gate";
import { useGateRealtime } from "@/lib/hooks/use-gate-realtime";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import type { GateEntryEvent, SpendTier, UserProfile } from "@/lib/types";
import { tierAccent, tierLabel } from "@/lib/utils";

interface ScannedGuest {
  profile: UserProfile;
  microHold:
    | { ok: true; amount: number; holdId: string }
    | { ok: false; reason: string }
    | null;
}

export default function GateScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState<ScannedGuest | null>(null);
  const [events, setEvents] = useState<GateEntryEvent[]>(DEMO_GATE_EVENTS);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const onRealtimeEvent = useCallback((event: GateEntryEvent) => {
    setEvents((prev) => {
      if (prev.some((item) => item.id === event.id)) return prev;
      return [event, ...prev].slice(0, 12);
    });
  }, []);

  useGateRealtime(NEON_CLUB_ID, onRealtimeEvent);

  useEffect(() => {
    void fetchRecentGateEvents(NEON_CLUB_ID).then((live) => {
      if (live?.length) setEvents(live);
    });
  }, []);

  const handlePayload = useCallback(async (raw: string) => {
    const verified = await fetch("/api/pass/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: raw }),
    })
      .then(
        (r) =>
          r.json() as Promise<{
            ok?: boolean;
            reason?: string;
            pass?: {
              userId: string;
              name: string;
              tier: SpendTier;
              mandate: string | null;
              visits?: number;
            };
          }>
      )
      .catch(() => null);

    if (!verified?.ok || !verified.pass) {
      setError(verified?.reason ?? "Invalid Member Pass QR");
      return;
    }

    const profile: UserProfile = {
      ...DEMO_CUSTOMER,
      id: verified.pass.userId,
      full_name: verified.pass.name,
      global_spend_tier: verified.pass.tier,
      autopay_mandate_id: verified.pass.mandate,
      lifetime_visits: verified.pass.visits ?? DEMO_CUSTOMER.lifetime_visits,
    };

    const { event, microHold } = await emitGateEntry({
      clubId: NEON_CLUB_ID,
      userId: profile.id,
      guestName: profile.full_name,
      spendTier: profile.global_spend_tier,
      mandateId: profile.autopay_mandate_id,
    });

    setGuest({ profile, microHold });
    setEvents((prev) => [event, ...prev].slice(0, 12));
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, []);

  async function startScanner() {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const scanner = new Html5Qrcode("gate-qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await scanner.stop();
          setScanning(false);
          await handlePayload(decoded);
        },
        () => undefined
      );
    } catch {
      setScanning(false);
      setError("Camera permission is required for Member Pass scanning.");
    }
  }

  async function demoScan() {
    // Demo button uses unsigned JSON accepted by /api/pass/verify.
    // Live camera reads HMAC-signed QR minted on /pass.
    await handlePayload(
      JSON.stringify({
        type: "MAITAB_MEMBER_PASS",
        userId: DEMO_CUSTOMER.id,
        name: DEMO_CUSTOMER.full_name,
        tier: DEMO_CUSTOMER.global_spend_tier,
        mandate: DEMO_CUSTOMER.autopay_mandate_id,
        visits: DEMO_CUSTOMER.lifetime_visits,
      })
    );
  }

  return (
    <div className="min-h-[100dvh] bg-nightlife-radial px-4 py-6 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="optimus-glass mb-6 flex items-center justify-between gap-3 rounded-xl px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLockup />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Gate Scanner
              </h1>
              <p className="text-sm text-muted-foreground">
                Live channel · gate_entry_events · zero revenue access
              </p>
            </div>
          </div>
          <StatusPill label="GATE_STAFF" tone="violet" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-4">
            <div
              id="gate-qr-reader"
              className="overflow-hidden rounded-xl border border-border bg-slate-200/80"
            />
            {!scanning ? (
              <div className="grid min-h-[240px] place-items-center text-center">
                <div>
                  <Camera className="mx-auto h-10 w-10 text-accent-violet" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Request camera permission to scan Member Passes.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <NeonButton onClick={startScanner} disabled={scanning}>
                <Camera className="h-4 w-4" />
                Start Camera Scan
              </NeonButton>
              <NeonButton tone="ghost" onClick={demoScan}>
                Demo Scan
              </NeonButton>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-accent-ruby">{error}</p>
            ) : null}
          </GlassPanel>

          <GlassPanel className="p-5" glow="violet">
            {guest ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Guest
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
                      {guest.profile.full_name}
                    </h2>
                  </div>
                  <UserRound className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierAccent(guest.profile.global_spend_tier)}`}
                  >
                    {tierLabel(guest.profile.global_spend_tier)}
                  </span>
                  <StatusPill
                    label={`${guest.profile.lifetime_visits} visits`}
                    tone="muted"
                  />
                </div>
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Favorite drinks
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                    {guest.profile.favorite_drinks.map((drink) => (
                      <li key={drink.name}>{drink.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 rounded-xl border border-border bg-secondary p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent-emerald" />
                    <p className="text-sm font-medium text-foreground">
                      Micro-hold check
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {guest.microHold?.ok
                      ? `AutoPay verified · ₹${guest.microHold.amount} hold ${guest.microHold.holdId}`
                      : guest.microHold?.reason ?? "Pending"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[280px] place-items-center text-center text-muted-foreground">
                Scan a pass to surface guest hospitality context.
              </div>
            )}
          </GlassPanel>
        </div>

        <GlassPanel className="mt-4 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Recent entries (realtime)
          </p>
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"
              >
                <span className="text-foreground">{event.guest_name}</span>
                <span className="text-accent-gold">{event.spend_tier}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
