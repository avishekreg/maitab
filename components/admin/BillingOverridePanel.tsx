"use client";

import { useEffect, useState } from "react";
import { AdminSection } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import type {
  MgGmvInvoicePreview,
  PlanId,
  PlatformPlan,
  VenueBillingOverride,
} from "@/lib/billing/mg-gmv";
import { cn, formatINR } from "@/lib/utils";

const labelClass = "text-zinc-300 font-medium text-xs tracking-wider";
const selectClass =
  "mt-1.5 w-full bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl font-medium focus:ring-1 focus:ring-violet-500 outline-none";
const inputClass =
  "mt-1.5 w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 px-4 py-2.5 rounded-xl focus:border-violet-500 outline-none disabled:opacity-40";

export function BillingOverridePanel() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [venues, setVenues] = useState<VenueBillingOverride[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [preview, setPreview] = useState<MgGmvInvoicePreview | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = venues.find((v) => v.venue_id === activeId) ?? venues[0];

  async function load(venueId?: string) {
    const q = venueId ? `?venueId=${encodeURIComponent(venueId)}` : "";
    const res = await fetch(`/api/admin/billing${q}`);
    const data = (await res.json()) as {
      plans?: PlatformPlan[];
      venues?: VenueBillingOverride[];
      preview?: MgGmvInvoicePreview | null;
    };
    setPlans(data.plans ?? []);
    setVenues(data.venues ?? []);
    if (!activeId && data.venues?.[0]) setActiveId(data.venues[0].venue_id);
    if (data.preview) setPreview(data.preview);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (activeId) void load(activeId);
  }, [activeId]);

  function patchActive(patch: Partial<VenueBillingOverride>) {
    if (!active) return;
    setVenues((prev) =>
      prev.map((v) =>
        v.venue_id === active.venue_id ? { ...v, ...patch } : v
      )
    );
  }

  async function save() {
    if (!active) return;
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/admin/billing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(active),
    });
    const data = (await res.json()) as {
      ok: boolean;
      preview?: MgGmvInvoicePreview;
    };
    setBusy(false);
    if (data.preview) setPreview(data.preview);
    setNote(
      data.ok
        ? `Saved · payable ${formatINR(data.preview?.final_payable_amount ?? 0)} (${data.preview?.binding_leg})`
        : "Save failed"
    );
  }

  return (
    <AdminSection
      title="Venue billing overrides"
      description="Minimum Guarantee vs GMV take-rate offset. Custom deals replace plan defaults. Final invoice = GREATEST(MG, GMV × %)."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {venues.map((v) => (
          <button
            key={v.venue_id}
            type="button"
            onClick={() => setActiveId(v.venue_id)}
            className={cn(
              "px-4 py-1.5 rounded-xl border text-sm transition",
              active?.venue_id === v.venue_id
                ? "bg-violet-600/30 border-violet-500 text-violet-200 font-semibold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
          >
            {v.venue_name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className={labelClass}>Plan</span>
              <select
                className={selectClass}
                value={active.plan_id}
                onChange={(e) =>
                  patchActive({ plan_id: e.target.value as PlanId })
                }
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} · MG {formatINR(p.default_base_mg)} /{" "}
                    {p.default_gmv_percent}%
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="rounded border-zinc-600 bg-zinc-900 accent-violet-500"
                checked={active.is_custom_deal}
                onChange={(e) =>
                  patchActive({ is_custom_deal: e.target.checked })
                }
              />
              Custom deal override
            </label>

            <label className="block">
              <span className={labelClass}>Custom base MG (₹)</span>
              <input
                type="number"
                disabled={!active.is_custom_deal}
                className={inputClass}
                placeholder="Enter custom MG"
                value={active.custom_base_mg ?? ""}
                onChange={(e) =>
                  patchActive({
                    custom_base_mg: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>

            <label className="block">
              <span className={labelClass}>Custom GMV %</span>
              <input
                type="number"
                step="0.1"
                disabled={!active.is_custom_deal}
                className={inputClass}
                placeholder="Enter GMV %"
                value={active.custom_gmv_percent ?? ""}
                onChange={(e) =>
                  patchActive({
                    custom_gmv_percent: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>

            <NeonButton size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save override"}
            </NeonButton>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Month preview
              </p>
              {preview ? (
                <StatusPill
                  label={preview.binding_leg === "MG" ? "MG binds" : "GMV binds"}
                  tone={preview.binding_leg === "MG" ? "gold" : "violet"}
                />
              ) : null}
            </div>
            {preview ? (
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">Live GMV</dt>
                  <dd className="tabular-nums text-zinc-100">
                    {formatINR(preview.total_gmv)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">Effective MG</dt>
                  <dd className="tabular-nums text-zinc-100">
                    {formatINR(preview.effective_base_mg)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">
                    GMV cut ({preview.effective_gmv_percent}%)
                  </dt>
                  <dd className="tabular-nums text-zinc-100">
                    {formatINR(preview.calculated_gmv_cut)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-zinc-800 pt-2 font-semibold text-white">
                  <dt>Final payable</dt>
                  <dd className="tabular-nums text-amber-400">
                    {formatINR(preview.final_payable_amount)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">Loading…</p>
            )}
          </div>
        </div>
      ) : null}

      {note ? (
        <p className="mt-3 text-sm text-emerald-400">{note}</p>
      ) : null}
    </AdminSection>
  );
}
