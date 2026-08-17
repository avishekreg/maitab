"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
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
      hideTitle
      title="Sovereign no-code configuration"
      subtitle="Live API keys, webhook endpoints, and dynamic pricing. Access is Google OAuth email gated via SUPER_ADMIN_EMAILS."
    >
      <div className="min-h-full bg-[#faf9f5] text-zinc-900">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-zinc-950 md:text-4xl">
          Sovereign no-code configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-600">
          Live API keys, webhook endpoints, and dynamic pricing. Access is Google
          OAuth email gated via SUPER_ADMIN_EMAILS.
        </p>

        {note ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
            {note}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-xs transition-all",
                group === g
                  ? "bg-zinc-900 font-bold text-white shadow-md"
                  : "border border-zinc-200 bg-white font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
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
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold text-zinc-900">
                    {row.label}
                  </p>
                  <p className="font-mono text-xs text-zinc-500">{row.config_key}</p>
                </div>
                <span className="rounded-md border border-amber-300/60 bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                  {row.is_secret ? "SECRET" : "RUNTIME"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="min-w-[220px] flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-violet-500"
                  value={drafts[row.config_key] ?? row.value_encrypted}
                  placeholder="Paste value"
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [row.config_key]: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveRow(row)}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-violet-500 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
