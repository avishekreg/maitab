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
import { formatINR } from "@/lib/utils";

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
            className={
              (active?.venue_id === v.venue_id
                ? "border-accent-violet bg-accent-violet/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground") +
              " rounded-lg border px-3 py-1.5 text-sm"
            }
          >
            {v.venue_name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm">
              Plan
              <select
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active.is_custom_deal}
                onChange={(e) =>
                  patchActive({ is_custom_deal: e.target.checked })
                }
              />
              Custom deal override
            </label>

            <label className="block text-sm">
              Custom base MG (₹)
              <input
                type="number"
                disabled={!active.is_custom_deal}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 disabled:opacity-40"
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

            <label className="block text-sm">
              Custom GMV %
              <input
                type="number"
                step="0.1"
                disabled={!active.is_custom_deal}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 disabled:opacity-40"
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

          <div className="rounded-xl border border-border bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
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
                  <dt className="text-muted-foreground">Live GMV</dt>
                  <dd className="tabular-nums">{formatINR(preview.total_gmv)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Effective MG</dt>
                  <dd className="tabular-nums">
                    {formatINR(preview.effective_base_mg)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    GMV cut ({preview.effective_gmv_percent}%)
                  </dt>
                  <dd className="tabular-nums">
                    {formatINR(preview.calculated_gmv_cut)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                  <dt>Final payable</dt>
                  <dd className="tabular-nums text-accent-gold">
                    {formatINR(preview.final_payable_amount)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        </div>
      ) : null}

      {note ? (
        <p className="mt-3 text-sm text-accent-emerald">{note}</p>
      ) : null}
    </AdminSection>
  );
}
