"use client";

import { useEffect, useState } from "react";
import {
  AdminSection,
  AdminShell,
} from "@/components/admin/AdminShell";
import { ComplianceBanner } from "@/components/compliance/ComplianceBanner";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AggregatorSettingsPublic } from "@/lib/aggregators/settings";
import type { VenueCompliance } from "@/lib/compliance/watchdog";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import { cn } from "@/lib/utils";

export default function ClubSettingsPage() {
  const venue = useVenueStore(selectActiveVenue);
  const venueId = useVenueStore((s) => s.activeVenueId);

  const [zomatoKey, setZomatoKey] = useState("");
  const [swiggyKey, setSwiggyKey] = useState("");
  const [lockout, setLockout] = useState(false);
  const [settings, setSettings] = useState<AggregatorSettingsPublic | null>(
    null
  );
  const [compliance, setCompliance] = useState<VenueCompliance | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNote(null);
    setZomatoKey("");
    setSwiggyKey("");
    void fetch(`/api/club/aggregator?venueId=${venueId}`)
      .then((r) => r.json())
      .then(
        (d: { ok?: boolean; settings?: AggregatorSettingsPublic }) => {
          if (d.settings) {
            setSettings(d.settings);
            setLockout(d.settings.external_table_lockout_enabled);
            setZomatoKey(d.settings.zomato_api_key_masked || "");
            setSwiggyKey(d.settings.swiggy_api_key_masked || "");
          }
        }
      )
      .catch(() => null);
    void fetch(`/api/ops/compliance?venueId=${venueId}`)
      .then((r) => r.json())
      .then((d: { compliance?: VenueCompliance }) => {
        if (d.compliance) setCompliance(d.compliance);
      })
      .catch(() => null);
  }, [venueId]);

  async function saveCompliance() {
    if (!compliance) return;
    setBusy(true);
    const res = await fetch("/api/ops/compliance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compliance),
    });
    const data = (await res.json()) as {
      ok: boolean;
      compliance?: VenueCompliance;
    };
    setBusy(false);
    if (data.compliance) setCompliance(data.compliance);
    setNote(
      data.ok
        ? `Compliance ${data.compliance?.compliance_status ?? "updated"}`
        : "Compliance save failed"
    );
  }

  async function save(opts?: { clearZomato?: boolean; clearSwiggy?: boolean }) {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/club/aggregator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId,
        zomatoApiKey: opts?.clearZomato ? "" : zomatoKey,
        swiggyApiKey: opts?.clearSwiggy ? "" : swiggyKey,
        clearZomato: opts?.clearZomato,
        clearSwiggy: opts?.clearSwiggy,
        externalTableLockoutEnabled: lockout,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      reason?: string;
      settings?: AggregatorSettingsPublic;
      sync_workers?: string;
    };
    setBusy(false);

    if (!data.ok || !data.settings) {
      setNote(data.reason ?? "Save failed");
      return;
    }

    setSettings(data.settings);
    setLockout(data.settings.external_table_lockout_enabled);
    setZomatoKey(data.settings.zomato_api_key_masked || "");
    setSwiggyKey(data.settings.swiggy_api_key_masked || "");
    setNote(
      data.settings.aggregator_sync_active
        ? `Keys encrypted · sync workers ${data.sync_workers ?? "ready"}.`
        : "No keys stored — aggregator table-sync workers stay disabled. Core ops unaffected."
    );
  }

  const syncActive = settings?.aggregator_sync_active ?? false;

  return (
    <AdminShell
      role="CLUB_ADMIN"
      title="Venue settings"
      subtitle={`${venue.short_name} — optional aggregator keys. Empty keys keep sync workers off.`}
    >
      <div className="space-y-6">
        <ComplianceBanner venueId={venueId} />

        {note ? (
          <p className="rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm">
            {note}
          </p>
        ) : null}

        <AdminSection
          title="License & compliance"
          description="Liquor / FSSAI expiries auto-suspend guest ordering. Admin login stays open."
          action={
            <StatusPill
              label={compliance?.compliance_status ?? "…"}
              tone={
                compliance?.compliance_status === "SUSPENDED"
                  ? "ruby"
                  : compliance?.compliance_status === "WARNING"
                    ? "gold"
                    : "emerald"
              }
            />
          }
        >
          {compliance ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Liquor license URL
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={compliance.liquor_license_url ?? ""}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      liquor_license_url: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Liquor expiry
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={compliance.liquor_license_expiry ?? ""}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      liquor_license_expiry: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                FSSAI license URL
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={compliance.fssai_license_url ?? ""}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      fssai_license_url: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                FSSAI expiry
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={compliance.fssai_license_expiry ?? ""}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      fssai_license_expiry: e.target.value || null,
                    })
                  }
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                GSTIN
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={compliance.gstin ?? ""}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      gstin: e.target.value || null,
                    })
                  }
                />
              </label>
              <NeonButton
                size="sm"
                disabled={busy}
                onClick={() => void saveCompliance()}
              >
                Save licenses
              </NeonButton>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </AdminSection>

        <AdminSection
          title="Aggregator Integrations (Optional)"
          description="Connect optional delivery partners only if you have merchant credentials. Secrets are encrypted at rest on the venue record."
          action={
            <StatusPill
              label={syncActive ? "SYNC ARMED" : "SYNC OFF"}
              tone={syncActive ? "emerald" : "muted"}
            />
          }
        >
          <div className="space-y-5">
            <label className="block text-sm">
              <span className="text-muted-foreground">
                Zomato District Webhook Secret / Merchant Key
              </span>
              <input
                type="password"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                placeholder={
                  settings?.has_zomato_key
                    ? "•••• stored — paste to replace"
                    : "Paste merchant / webhook secret"
                }
                value={zomatoKey}
                onChange={(e) => setZomatoKey(e.target.value)}
              />
              {settings?.has_zomato_key ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-muted-foreground underline"
                  onClick={() => void save({ clearZomato: true })}
                >
                  Clear Zomato key
                </button>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className="text-muted-foreground">
                Swiggy SteppinOut Partner API Key
              </span>
              <input
                type="password"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                placeholder={
                  settings?.has_swiggy_key
                    ? "•••• stored — paste to replace"
                    : "Paste partner API key"
                }
                value={swiggyKey}
                onChange={(e) => setSwiggyKey(e.target.value)}
              />
              {settings?.has_swiggy_key ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-muted-foreground underline"
                  onClick={() => void save({ clearSwiggy: true })}
                >
                  Clear Swiggy key
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <div>
                <p className="font-semibold text-foreground">
                  Enable Automatic External Table Lockout
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When keys exist and this is on, live tabs can hold external
                  aggregator inventory. Without keys, workers stay safely off.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lockout}
                onClick={() => setLockout((v) => !v)}
                className={cn(
                  "relative h-8 w-14 shrink-0 rounded-full transition",
                  lockout ? "bg-accent-gold" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition",
                    lockout ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <NeonButton
                type="button"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save aggregator settings"}
              </NeonButton>
            </div>

            <p className="text-xs text-muted-foreground">
              Stored on <code className="font-mono">clubs</code> as{" "}
              <code className="font-mono">zomato_api_key</code>,{" "}
              <code className="font-mono">swiggy_api_key</code>,{" "}
              <code className="font-mono">aggregator_sync_active</code>. Empty
              keys ⇒ <code className="font-mono">aggregator_sync_active =
              false</code>.
            </p>
          </div>
        </AdminSection>
      </div>
    </AdminShell>
  );
}
