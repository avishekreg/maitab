"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { AdminSection, AdminShell, KpiStrip } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEMO_METRICS } from "@/lib/demo/data";
import { useSystemConfigStore } from "@/lib/store/system-config-store";
import type { SystemConfigItem } from "@/lib/admin/system-config";
import { cn, formatINR } from "@/lib/utils";

const FRAUD_LOGS = [
  {
    id: "f1",
    event: "Promo lockout",
    detail: "BEER promo blocked within 1.5km of a competitor",
    tone: "ruby" as const,
  },
  {
    id: "f2",
    event: "Geo settle",
    detail: "Session exited the 50m fence after sustained distance gain",
    tone: "gold" as const,
  },
  {
    id: "f3",
    event: "QR reject",
    detail: "Cryptographic seal mismatch on a table token",
    tone: "ruby" as const,
  },
  {
    id: "f4",
    event: "AutoPay fail",
    detail: "Micro-hold declined for mandate_fail_demo",
    tone: "ruby" as const,
  },
];

const FLAGS = [
  { key: "flags.lucky_draw_global", label: "Lucky Draw Engine" },
  { key: "flags.av_takeover", label: "AV Screen Takeover" },
  { key: "flags.micro_hold_enforcement", label: "Micro-Hold Pre-Auth" },
];

export default function SuperAdminPage() {
  const metrics = DEMO_METRICS;
  const configs = useSystemConfigStore((s) => s.configs);
  const hydrate = useSystemConfigStore((s) => s.hydrate);
  const setFlag = useSystemConfigStore((s) => s.setFlag);
  const setRadius = useSystemConfigStore((s) => s.setRadius);
  const getFlag = useSystemConfigStore((s) => s.getFlag);
  const getRadius = useSystemConfigStore((s) => s.getRadius);
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data: { configs?: SystemConfigItem[] }) => {
        if (data.configs?.length) hydrate(data.configs);
      })
      .catch(() => undefined);
  }, [hydrate]);

  const radius = getRadius();
  const radiusKm = useMemo(() => (radius / 1000).toFixed(1), [radius]);
  const secretCount = configs.filter(
    (c) => c.is_secret && c.value_encrypted
  ).length;

  async function persistFlag(key: string, enabled: boolean) {
    setFlag(key, enabled);
    setSaving(key);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: key,
        value_json: { enabled },
      }),
    });
    setSaving(null);
    setNote(`Updated ${key.split(".").pop()}`);
  }

  async function persistRadius(meters: number) {
    setRadius(meters);
    setSaving("geo.lockout_radius_m");
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: "geo.lockout_radius_m",
        value_json: { radius_m: meters },
      }),
    });
    setSaving(null);
    setNote(`Lockout radius · ${meters}m`);
  }

  return (
    <AdminShell
      role="SUPER_ADMIN"
      title="Command Center"
      subtitle="Platform GMV, geofence policy, feature flags, and fraud health in one calm workspace."
      actions={
        <Link href="/admin/super/config">
          <NeonButton size="sm">
            <KeyRound className="h-4 w-4" />
            Integrations
          </NeonButton>
        </Link>
      }
    >
      <KpiStrip
        items={[
          {
            label: "Platform GMV",
            value: formatINR(metrics.total_gmv),
            tone: "gold",
          },
          { label: "Active clubs", value: String(metrics.active_clubs) },
          {
            label: "Fraud · 24h",
            value: String(metrics.fraud_flags_24h + 1),
            tone: "ruby",
          },
          { label: "Lockout", value: `${radiusKm} km` },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminSection
          title="Global controls"
          description="Runtime switches that apply across every club."
        >
          <label className="block">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Geo lockout radius</span>
              <span className="type-title text-foreground">
                {radiusKm} km
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={3000}
              step={100}
              value={radius}
              onChange={(e) => void persistRadius(Number(e.target.value))}
              className="mt-3 w-full accent-[#7C3AED]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>0.5 km</span>
              <span>3.0 km</span>
            </div>
          </label>

          <div className="mt-6 divide-y divide-white/10 rounded-xl border border-border">
            {FLAGS.map((flag) => {
              const enabled = getFlag(flag.key);
              return (
                <div
                  key={flag.key}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{flag.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {saving === flag.key ? "Saving…" : flag.key}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void persistFlag(flag.key, !enabled)}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition",
                      enabled ? "bg-accent-emerald" : "bg-white/15"
                    )}
                    aria-pressed={enabled}
                    aria-label={`Toggle ${flag.label}`}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                        enabled ? "left-5" : "left-0.5"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          {note ? (
            <p className="mt-3 text-xs text-accent-emerald">{note}</p>
          ) : null}
        </AdminSection>

        <AdminSection
          title="Fraud & health"
          description="Latest platform signals that need attention."
        >
          <ul className="space-y-0 divide-y divide-white/10 rounded-xl border border-border">
            {FRAUD_LOGS.map((log) => (
              <li key={log.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      log.tone === "ruby"
                        ? "text-accent-ruby"
                        : "text-accent-gold"
                    )}
                  >
                    {log.event}
                  </p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {log.detail}
                </p>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminSection title="Subscriptions" description="Club plan mix.">
          <div className="space-y-3">
            {Object.entries(metrics.subscriptions).map(([tier, count]) => {
              const max = Math.max(
                ...Object.values(metrics.subscriptions),
                1
              );
              const width = Math.round((count / max) * 100);
              return (
                <div key={tier}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground/90">{tier}</span>
                    <span className="tabular-nums text-accent-gold">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent-violet"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminSection>

        <AdminSection
          title="Integration vault"
          description="Encrypted provider keys and runtime webhooks."
          action={
            <Link href="/admin/super/config">
              <NeonButton size="sm" tone="ghost">
                Open hub
              </NeonButton>
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-white/[0.02] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Secrets
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {secretCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white/[0.02] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Runtime keys
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {configs.filter((c) => !c.is_secret).length}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Settlement gateways, messaging, maps, and AI providers live in the
            no-code hub — encrypted at rest before write.
          </p>
        </AdminSection>
      </div>
    </AdminShell>
  );
}
