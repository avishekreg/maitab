"use client";

import { useEffect, useState } from "react";
import {
  AdminSection,
  AdminShell,
  KpiStrip,
} from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  GEO_FLASH_CREDIT_COST,
  type FlashAudience,
  type FlashCampaign,
} from "@/lib/flash/campaigns";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import { formatINR } from "@/lib/utils";

export default function FlashPromosPage() {
  const venue = useVenueStore(selectActiveVenue);
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const setVenues = useVenueStore.setState;

  const [title, setTitle] = useState("MRP Drinks for Next 60 Mins");
  const [category, setCategory] = useState("BEER");
  const [duration, setDuration] = useState(60);
  const [audience, setAudience] = useState<FlashAudience>("CHECKED_IN");
  const [credits, setCredits] = useState(venue.credit_balance);
  const [campaigns, setCampaigns] = useState<FlashCampaign[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCredits(venue.credit_balance);
    void fetch(`/api/promos/campaigns?venueId=${activeVenueId}`)
      .then((r) => r.json())
      .then((d: { campaigns?: FlashCampaign[]; credit_balance?: number }) => {
        if (d.campaigns) setCampaigns(d.campaigns);
        if (typeof d.credit_balance === "number") setCredits(d.credit_balance);
      })
      .catch(() => null);
  }, [activeVenueId, venue.credit_balance]);

  async function launch() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/promos/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: activeVenueId,
        title,
        category,
        audience,
        durationMinutes: duration,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      reason?: string;
      campaign?: FlashCampaign;
      credit_balance?: number;
    };
    setBusy(false);

    if (!data.ok) {
      setNote(data.reason ?? "Launch failed");
      return;
    }

    if (typeof data.credit_balance === "number") {
      setCredits(data.credit_balance);
      setVenues((s) => ({
        venues: s.venues.map((v) =>
          v.id === activeVenueId
            ? { ...v, credit_balance: data.credit_balance! }
            : v
        ),
      }));
    }
    if (data.campaign) setCampaigns((prev) => [data.campaign!, ...prev]);
    setNote(
      audience === "GEO_GLOBAL"
        ? `Geo broadcast live — deducted ${formatINR(GEO_FLASH_CREDIT_COST)} Platform Promo Credits.`
        : "Internal flash offer pushed to checked-in guests only (no credit burn)."
    );
  }

  async function topUp(amount: number, provider: "RAZORPAY" | "CASHFREE") {
    setBusy(true);
    const res = await fetch("/api/promos/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: activeVenueId,
        amount,
        provider,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      credit_balance?: number;
      reason?: string;
    };
    setBusy(false);
    if (!data.ok) {
      setNote(data.reason ?? "Top-up failed");
      return;
    }
    if (typeof data.credit_balance === "number") {
      setCredits(data.credit_balance);
      setVenues((s) => ({
        venues: s.venues.map((v) =>
          v.id === activeVenueId
            ? { ...v, credit_balance: data.credit_balance! }
            : v
        ),
      }));
    }
    setNote(`Top-up via ${provider} simulated — balance updated.`);
  }

  return (
    <AdminShell
      role="CLUB_ADMIN"
      title="Flash Campaigns"
      subtitle="Timed offers for checked-in guests, or monetized geo-zone broadcasts powered by Platform Promo Credits."
    >
      <div className="space-y-6">
        <KpiStrip
          items={[
            {
              label: "Promo credits",
              value: formatINR(credits),
              tone: "gold",
            },
            {
              label: "Active flashes",
              value: String(campaigns.filter((c) => c.status === "ACTIVE").length),
            },
            {
              label: "Geo push cost",
              value: formatINR(GEO_FLASH_CREDIT_COST),
            },
            {
              label: "Venue",
              value: venue.short_name.split(" ").slice(-1)[0] ?? "—",
            },
          ]}
        />

        {note ? (
          <p className="rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm">
            {note}
          </p>
        ) : null}

        <AdminSection
          title="Launch flash deal"
          description="Checked-in only is free. Global geo-zone push burns Platform Promo Credits (Syncra Systems LLP SaaS)."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Offer title</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Category</span>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="BEER">BEER</option>
                <option value="COCKTAIL">COCKTAIL</option>
                <option value="SHOT">SHOT</option>
                <option value="ALL">ALL / MRP</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Duration (minutes)</span>
              <input
                type="number"
                min={15}
                max={180}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 60)}
              />
            </label>
            <fieldset className="text-sm">
              <legend className="text-muted-foreground">Audience</legend>
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    checked={audience === "CHECKED_IN"}
                    onChange={() => setAudience("CHECKED_IN")}
                  />
                  Internal — currently checked-in guests (₹0 credits)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    checked={audience === "GEO_GLOBAL"}
                    onChange={() => setAudience("GEO_GLOBAL")}
                  />
                  Global geo-zone push (−{formatINR(GEO_FLASH_CREDIT_COST)} credits)
                </label>
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <NeonButton type="button" disabled={busy} onClick={() => void launch()}>
              {busy ? "Launching…" : "Trigger flash campaign"}
            </NeonButton>
          </div>
        </AdminSection>

        <AdminSection
          title="Top up Platform Promo Credits"
          description="Settlement gateway top-ups create Syncra Systems LLP SaaS revenue."
        >
          <div className="flex flex-wrap gap-2">
            <NeonButton
              type="button"
              tone="ghost"
              disabled={busy}
              onClick={() => void topUp(1000, "RAZORPAY")}
            >
              +₹1,000 Primary Gateway
            </NeonButton>
            <NeonButton
              type="button"
              tone="ghost"
              disabled={busy}
              onClick={() => void topUp(2500, "CASHFREE")}
            >
              +₹2,500 Secondary Gateway
            </NeonButton>
          </div>
        </AdminSection>

        <AdminSection title="Recent campaigns">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            <ul className="space-y-3">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.category} · {c.duration_minutes}m · ends{" "}
                      {new Date(c.ends_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill
                      label={c.audience === "GEO_GLOBAL" ? "GEO" : "IN-VENUE"}
                      tone={c.audience === "GEO_GLOBAL" ? "violet" : "gold"}
                    />
                    <StatusPill label={c.status} tone="emerald" />
                    {c.credit_cost > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        −{formatINR(c.credit_cost)}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>
    </AdminShell>
  );
}
