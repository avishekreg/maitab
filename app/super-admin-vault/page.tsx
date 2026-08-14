"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
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

/**
 * Hidden Super Admin vault — Master Auth (portal key) + 2FA PIN.
 * Not linked from public /login.
 */
export default function SuperAdminVaultPage() {
  const router = useRouter();
  const [portalKey, setPortalKey] = useState("");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [configs, setConfigs] = useState<PlatformConfigRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [group, setGroup] = useState<ConfigGroup>("PAYMENT_GATEWAY_CREDENTIALS");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => configs.filter((c) => c.config_group === group),
    [configs, group]
  );

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const auth = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maitab-portal-key": portalKey,
        },
        body: JSON.stringify({ role: "SUPER_ADMIN", portalKey }),
      });
      const authData = (await auth.json()) as { ok: boolean; reason?: string };
      if (!authData.ok) {
        setError("Master Auth failed.");
        return;
      }

      const cfg = await fetch("/api/admin/platform-config", {
        headers: { "x-maitab-vault-pin": pin },
      });
      const cfgData = (await cfg.json()) as {
        ok: boolean;
        configs?: PlatformConfigRow[];
        reason?: string;
      };
      if (!cfgData.ok) {
        setError(cfgData.reason ?? "2FA PIN rejected.");
        return;
      }
      setConfigs(cfgData.configs ?? []);
      setUnlocked(true);
      setNote("Vault unlocked · live no-code config engine ready.");
    } catch {
      setError("Unable to reach vault.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRow(row: PlatformConfigRow) {
    const value = drafts[row.config_key] ?? row.value_encrypted;
    setBusy(true);
    const res = await fetch("/api/admin/platform-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-maitab-vault-pin": pin,
      },
      body: JSON.stringify({
        vaultPin: pin,
        config_key: row.config_key,
        value,
        label: row.label,
        config_group: row.config_group,
        is_secret: row.is_secret,
      }),
    });
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

  useEffect(() => {
    // Soft-hide: no indexable crumbs in UI chrome.
  }, []);

  if (!unlocked) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07080c] px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12151A] p-8 shadow-2xl">
          <MaiTabLogo variant="IconOnly" className="h-10 w-10" />
          <h1 className="mt-5 font-display text-2xl font-bold">
            Super Admin Vault
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Master Auth + 2FA PIN. This route is not listed on public login.
          </p>
          <label className="mt-6 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Portal key
            <input
              type="password"
              autoComplete="off"
              value={portalKey}
              onChange={(e) => setPortalKey(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
            2FA PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="••••"
            />
          </label>
          {error ? (
            <p className="mt-3 text-sm text-accent-ruby">{error}</p>
          ) : null}
          <NeonButton
            className="mt-5 w-full"
            tone="violet"
            disabled={busy || portalKey.length < 8 || pin.length < 4}
            onClick={() => void unlock()}
          >
            {busy ? "Verifying…" : "Unlock vault"}
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Hidden vault
            </p>
            <h1 className="font-display text-3xl font-bold">
              Dynamic Environment Config
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live edit API endpoints, webhooks, commissions, and settlement
              credentials — no redeploy.
            </p>
          </div>
          <div className="flex gap-2">
            <NeonButton
              size="sm"
              tone="ghost"
              onClick={() => router.push("/admin/super")}
            >
              Command center
            </NeonButton>
            <NeonButton
              size="sm"
              tone="ghost"
              onClick={() => router.push("/admin/super/config")}
            >
              Integration hub
            </NeonButton>
          </div>
        </div>

        {note ? (
          <p className="mt-4 rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2 text-sm text-accent-emerald">
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
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.1em]",
                group === g
                  ? "bg-pastel-lavender text-accent-violet ring-1 ring-accent-violet/40"
                  : "bg-secondary text-muted-foreground ring-1 ring-white/10"
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
              className="rounded-xl border border-border bg-secondary/40 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.config_key}</p>
                </div>
                <StatusPill
                  label={row.is_secret ? "Secret" : "Runtime"}
                  tone={row.is_secret ? "gold" : "muted"}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  value={drafts[row.config_key] ?? row.value_encrypted}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [row.config_key]: e.target.value,
                    }))
                  }
                />
                <NeonButton
                  size="sm"
                  disabled={busy}
                  onClick={() => void saveRow(row)}
                >
                  Save
                </NeonButton>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
