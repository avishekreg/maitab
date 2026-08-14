"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import type { ConfigGroup, PlatformConfigRow } from "@/lib/admin/platform-config";
import { cn } from "@/lib/utils";

const GROUPS: ConfigGroup[] = [
  "API_ENDPOINTS",
  "WEBHOOK_URLS",
  "COMMISSION_RATES",
  "GLOBAL_KEYS",
  "PAYMENT_GATEWAY_CREDENTIALS",
];

export default function SuperAdminVaultPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<PlatformConfigRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [group, setGroup] = useState<ConfigGroup>("PAYMENT_GATEWAY_CREDENTIALS");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(
    () => configs.filter((c) => c.config_group === group),
    [configs, group]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/admin/platform-config");
      if (res.status === 401 || res.status === 403) {
        router.replace("/login?denied=403");
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        configs?: PlatformConfigRow[];
      };
      if (!cancelled) setConfigs(data.configs ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveRow(row: PlatformConfigRow) {
    const value = drafts[row.config_key] ?? row.value_encrypted;
    setBusy(true);
    const res = await fetch("/api/admin/platform-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: row.config_key,
        value,
        label: row.label,
        config_group: row.config_group,
        is_secret: row.is_secret,
      }),
    });
    if (res.status === 401 || res.status === 403) {
      router.replace("/login?denied=403");
      setBusy(false);
      return;
    }
    const data = (await res.json()) as {
      ok: boolean;
      config?: PlatformConfigRow;
    };
    if (data.ok && data.config) {
      setConfigs((prev) =>
        prev.map((c) => (c.config_key === row.config_key ? { ...c, ...data.config } : c))
      );
      setNote(`Saved ${row.label}`);
    } else {
      setNote(`Failed to save ${row.label}`);
    }
    setBusy(false);
  }

  return (
    <AdminShell
      role="SUPER_ADMIN"
      title="Sovereign no-code configuration"
      subtitle="Live API keys, webhook endpoints, and dynamic pricing. Access is Google OAuth email gated via SUPER_ADMIN_EMAILS."
    >
      {note ? (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {note}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.1em]",
              group === g
                ? "bg-zinc-800 text-zinc-100 ring-1 ring-cyan-400/40"
                : "bg-zinc-950 text-zinc-400 ring-1 ring-zinc-800"
            )}
          >
            {g.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {filtered.map((row) => (
          <li
            key={row.config_key}
            className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-100">{row.label}</p>
                <p className="text-xs text-zinc-400">{row.config_key}</p>
              </div>
              <StatusPill
                label={row.is_secret ? "Secret" : "Runtime"}
                tone={row.is_secret ? "gold" : "muted"}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className="min-w-[220px] flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100"
                value={drafts[row.config_key] ?? row.value_encrypted}
                onChange={(e) =>
                  setDrafts((d) => ({
                    ...d,
                    [row.config_key]: e.target.value,
                  }))
                }
              />
              <NeonButton size="sm" disabled={busy} onClick={() => void saveRow(row)}>
                Save
              </NeonButton>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
