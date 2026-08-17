"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { AdminSection, AdminShell } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  maskSecret,
  type ConfigCategory,
  type SystemConfigItem,
} from "@/lib/admin/system-config";
import { useSystemConfigStore } from "@/lib/store/system-config-store";
import { cn } from "@/lib/utils";

const CATEGORIES: ConfigCategory[] = [
  "PAYMENTS",
  "MESSAGING",
  "MAPS",
  "AI",
  "GEO",
  "FEATURE_FLAGS",
];

export default function SuperAdminConfigPage() {
  const configs = useSystemConfigStore((s) => s.configs);
  const hydrate = useSystemConfigStore((s) => s.hydrate);
  const upsertLocal = useSystemConfigStore((s) => s.upsertLocal);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<ConfigCategory>("PAYMENTS");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data: { configs?: SystemConfigItem[] }) => {
        if (data.configs?.length) hydrate(data.configs);
      })
      .catch(() => undefined);
  }, [hydrate]);

  const filtered = useMemo(
    () => configs.filter((item) => item.category === active),
    [configs, active]
  );

  function draftValue(item: SystemConfigItem): string {
    if (drafts[item.config_key] !== undefined) return drafts[item.config_key]!;
    if (item.is_secret) return item.value_encrypted;
    if (item.config_key === "geo.lockout_radius_m") {
      return String(item.value_json.radius_m ?? 1500);
    }
    if (item.config_key === "payments.preauth_limit") {
      return String(item.value_json.amount ?? 10);
    }
    if (item.config_key === "ai.custom.webhook") {
      return String(item.value_json.url ?? "");
    }
    if (item.category === "FEATURE_FLAGS") {
      return String(Boolean(item.value_json.enabled));
    }
    return item.value_encrypted;
  }

  async function saveItem(item: SystemConfigItem) {
    const raw = draftValue(item);
    let value_json = item.value_json;
    let value_encrypted = item.is_secret ? raw : "";

    if (item.config_key === "geo.lockout_radius_m") {
      value_json = { radius_m: Number(raw) || 1500 };
    } else if (item.config_key === "payments.preauth_limit") {
      value_json = { amount: Number(raw) || 10 };
    } else if (item.config_key === "ai.custom.webhook") {
      value_json = { url: raw };
    } else if (item.category === "FEATURE_FLAGS") {
      value_json = { enabled: raw === "true" };
    }

    const secretForSave =
      item.is_secret && value_encrypted.includes("•")
        ? value_encrypted
        : value_encrypted;

    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: item.config_key,
        value_encrypted: secretForSave,
        value_json,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      mode?: string;
      encrypted?: boolean;
      config?: SystemConfigItem;
    };

    upsertLocal({
      ...item,
      value_encrypted: data.config?.value_encrypted ?? value_encrypted,
      value_json,
      updated_at: new Date().toISOString(),
    });
    setStatus(
      data.ok
        ? `Saved ${item.label}${data.encrypted ? " · encrypted" : ""}`
        : `Failed to save ${item.label}`
    );
  }

  return (
    <AdminShell
      role="SUPER_ADMIN"
      title="Integration Hub"
      subtitle="No-code provider keys and webhooks. Secrets are AES-encrypted before they hit storage."
    >
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-xs uppercase tracking-[0.12em] transition-all",
              active === category
                ? "bg-violet-600 border border-violet-400 text-white font-bold shadow-lg shadow-violet-600/30"
                : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300"
            )}
          >
            {category.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <AdminSection
        title={active.replaceAll("_", " ")}
        description={`${filtered.length} settings in this group`}
      >
        <div className="space-y-3">
          {filtered.map((item) => {
            const value = draftValue(item);
            const show = revealed[item.config_key];
            return (
              <div
                key={item.config_key}
                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-wide text-zinc-900">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">
                      {item.config_key}
                    </p>
                  </div>
                  <StatusPill
                    label={item.is_secret ? "SECRET" : "RUNTIME"}
                    tone={item.is_secret ? "gold" : "muted"}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.category === "FEATURE_FLAGS" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.config_key]: e.target.value,
                        }))
                      }
                      className="min-w-[200px] flex-1"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={item.is_secret && !show ? "password" : "text"}
                      value={value}
                      placeholder={
                        item.is_secret ? "Paste key / token" : "Enter value"
                      }
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.config_key]: e.target.value,
                        }))
                      }
                      className="min-w-[200px] flex-1"
                    />
                  )}

                  {item.is_secret ? (
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-600 shadow-sm transition-all hover:border-violet-400 hover:text-violet-600"
                      onClick={() =>
                        setRevealed((prev) => ({
                          ...prev,
                          [item.config_key]: !prev[item.config_key],
                        }))
                      }
                      aria-label="Toggle secret visibility"
                    >
                      {show ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}

                  <NeonButton
                    size="sm"
                    className="rounded-xl bg-violet-600 px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-violet-500"
                    onClick={() => void saveItem(item)}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </NeonButton>
                </div>

                {item.is_secret && item.value_encrypted ? (
                  <p className="mt-2 font-mono text-xs text-zinc-500">
                    Stored · {maskSecret(item.value_encrypted)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        {status ? (
          <p className="mt-4 text-sm text-emerald-700">{status}</p>
        ) : null}
      </AdminSection>
    </AdminShell>
  );
}
