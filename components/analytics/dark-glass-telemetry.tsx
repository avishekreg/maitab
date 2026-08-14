"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Droplets, FileText, Gauge, Shield } from "lucide-react";
import {
  BRAND_PARTNER_SCOPES,
  DEMO_TELEMETRY,
  HOURLY_VELOCITY,
  INVENTORY_ROWS,
  NETWORK_VENUES,
  SHARE_TABS,
  TIMEFRAMES,
  TOP_SKU_BY_COMPANY,
  filterTelemetry,
  matchesShareTab,
  timeframeMultiplier,
  type BrandPartnerKey,
  type NetworkVenueKey,
  type ShareTab,
  type TimeframeKey,
} from "@/lib/analytics/liquor-telemetry";
import { formatINR } from "@/lib/utils";

const CARD =
  "overflow-hidden bg-zinc-950/80 border border-zinc-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]";

const CYAN = "#06b6d4";
const AMBER = "#f59e0b";
const VIOLET = "#8b5cf6";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";

const COMPANY_COLORS: Record<string, string> = {
  Diageo: VIOLET,
  "Pernod Ricard": AMBER,
  Bacardi: CYAN,
  "AB InBev": EMERALD,
  "Beam Suntory": ROSE,
};

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-100 shadow-xl">
      <p className="mb-1 font-semibold text-zinc-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

const selectClass =
  "h-10 min-w-[180px] rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-cyan-500/50";

export function DarkGlassTelemetry({
  scope = "network",
  title,
  hideHeading = false,
}: {
  scope?: "network" | "venue" | "partner";
  title?: string;
  hideHeading?: boolean;
}) {
  const [venue, setVenue] = useState<NetworkVenueKey>(
    scope === "venue" ? "neon" : "all"
  );
  const [partner, setPartner] = useState<BrandPartnerKey>(
    scope === "partner" ? "Diageo" : "macro"
  );
  const [timeframe, setTimeframe] = useState<TimeframeKey>("tonight");
  const [category, setCategory] = useState<ShareTab>("All Spirits");
  const [draftNote, setDraftNote] = useState<string | null>(null);

  const rows = useMemo(
    () => filterTelemetry(DEMO_TELEMETRY, venue, partner),
    [venue, partner]
  );
  const scale = timeframeMultiplier(timeframe);

  const kpis = useMemo(() => {
    const gmv = rows.reduce((s, r) => s + r.billed_amount, 0) * scale;
    const pours = Math.round(rows.length * scale);
    const ml = rows.reduce((s, r) => s + r.volume_ml, 0) * scale;
    const bottles = ml / 750;
    const avgCost =
      rows.reduce((s, r) => s + r.pour_cost_pct, 0) / Math.max(rows.length, 1);
    return { gmv, pours, bottles, avgCost };
  }, [rows, scale]);

  const hourly = useMemo(() => {
    const venueScale = venue === "all" ? 1 : 0.38;
    const partnerScale = partner === "macro" ? 1 : 0.55;
    const tf = timeframe === "tonight" ? 1 : timeframe === "7d" ? 1.15 : 1.3;
    return HOURLY_VELOCITY.map((h) => ({
      hour: h.hour,
      beer: Math.round(h.beer * venueScale * partnerScale * tf * scale * 0.12),
      cocktails: Math.round(h.cocktails * venueScale * partnerScale * tf * scale * 0.12),
      tequila: Math.round(h.tequila * venueScale * partnerScale * tf * scale * 0.12),
      malts: Math.round(h.malts * venueScale * partnerScale * tf * scale * 0.12),
      hydration: Math.round(h.hydration * venueScale * partnerScale * tf * scale * 0.12),
    }));
  }, [venue, partner, timeframe, scale]);

  const share = useMemo(() => {
    const filtered = rows.filter((r) => matchesShareTab(r, category));
    const byCompany = new Map<
      string,
      { revenue: number; volume: number }
    >();
    for (const r of filtered) {
      const cur = byCompany.get(r.parent_company) ?? { revenue: 0, volume: 0 };
      cur.revenue += r.billed_amount * scale;
      cur.volume += r.volume_ml * scale;
      byCompany.set(r.parent_company, cur);
    }
    const totalVol = Array.from(byCompany.values()).reduce((s, v) => s + v.volume, 0);
    return Array.from(byCompany.entries()).map(([name, v]) => ({
      name,
      value: Number(((v.volume / Math.max(totalVol, 1)) * 100).toFixed(1)),
      revenue: v.revenue,
      sku: TOP_SKU_BY_COMPANY[name] ?? "—",
    }));
  }, [rows, category, scale]);

  const categoryAudit = useMemo(() => {
    const defs: { name: string; test: (r: (typeof rows)[number]) => boolean }[] = [
      {
        name: "Single Malts",
        test: (r) =>
          r.spirit_subcategory === "Single Malt Scotch" ||
          r.spirit_subcategory === "Indian Craft Single Malt",
      },
      { name: "Tequila", test: (r) => r.spirit_category === "Tequila & Mezcal" },
      { name: "Gin", test: (r) => r.spirit_category === "Gin" },
      { name: "Vodka", test: (r) => r.spirit_category === "Vodka" },
      {
        name: "Draught Beer",
        test: (r) =>
          r.spirit_subcategory === "Draught/Craft Taps" ||
          r.spirit_subcategory === "Stout",
      },
    ];
    return defs.map((d) => {
      const slice = rows.filter(d.test);
      const volume = slice.reduce((s, r) => s + r.volume_ml, 0) * scale;
      const gmv = slice.reduce((s, r) => s + r.billed_amount, 0) * scale;
      return {
        name: d.name,
        pours: Math.round(slice.length * scale),
        volume,
        gmv,
      };
    });
  }, [rows, scale]);

  const venueLabel =
    NETWORK_VENUES.find((v) => v.key === venue)?.label ?? "Network";
  const partnerLabel =
    BRAND_PARTNER_SCOPES.find((v) => v.key === partner)?.label ?? "Macro";
  const tfLabel = TIMEFRAMES.find((v) => v.key === timeframe)?.label ?? "Tonight";
  const stamp = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function exportPdf() {
    const prev = document.title;
    document.title = `mAITab Liquor Telemetry — ${venueLabel} — ${stamp}`;
    window.print();
    document.title = prev;
  }

  const heading =
    title ||
    (scope === "partner"
      ? "Brand executive liquor intelligence"
      : scope === "venue"
        ? "Venue liquor telemetry"
        : "Network liquor telemetry");

  return (
    <div className="relative isolate space-y-5 text-zinc-100">
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div>
          {!hideHeading ? (
            <>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                Alcohol consumption engine
              </p>
              <h2 className="mt-1 font-display text-2xl text-zinc-100">{heading}</h2>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Executive liquor intelligence</p>
          )}
        </div>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_20px_rgba(212,212,216,0.25)]"
        >
          <FileText className="h-4 w-4" />
          Export Executive Liquor Telemetry PDF
        </button>
      </div>

      <div className="print-only print-report hidden">
        <h1 className="text-xl font-bold">
          mAITab Liquor Intelligence &amp; Consumption Telemetry Report
        </h1>
        <p>
          Venue: {venueLabel} · Partner: {partnerLabel} · Timeframe: {tfLabel} · Generated{" "}
          {stamp}
        </p>

        <h2 className="mt-6 text-base font-semibold">KPI metrics overview</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total volume (ml)</td>
              <td>{Math.round(kpis.bottles * 750).toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td>Bottles depleted (750ml)</td>
              <td>{kpis.bottles.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Pour cost ratio</td>
              <td>{kpis.avgCost.toFixed(1)}% (target &lt; 22%)</td>
            </tr>
            <tr>
              <td>Alcohol GMV</td>
              <td>{formatINR(kpis.gmv)}</td>
            </tr>
            <tr>
              <td>Live pours</td>
              <td>{kpis.pours}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-6 text-base font-semibold">Category breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Pours</th>
              <th>Volume (ml)</th>
              <th>GMV</th>
            </tr>
          </thead>
          <tbody>
            {categoryAudit.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.pours}</td>
                <td>{Math.round(c.volume).toLocaleString("en-IN")}</td>
                <td>{formatINR(c.gmv)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-6 text-base font-semibold">
          Fast-moving vs dead stock &amp; pour leakage audit
        </h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Fast-moving (24h bottles)</th>
              <th>Dead stock (&gt;21 days)</th>
              <th>Pour variance (ml lost)</th>
            </tr>
          </thead>
          <tbody>
            {INVENTORY_ROWS.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.fast}</td>
                <td>{r.dead}</td>
                <td>{r.variance}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Estimated pour leakage rate: 1.4% (industry benchmark 4–6%).</p>

        <h2 className="mt-6 text-base font-semibold">
          Distributor requisition &amp; AI forecast
        </h2>
        <p>
          Don Julio 1942 &amp; Talisker 10YO are consuming at 3.8× normal pace.
          Projected stock depletion at 11:45 PM. One-tap purchase requisition is
          ready for distributor dispatch to the bonded warehouse.
        </p>
      </div>

      <div className="no-print space-y-5">

      <div className={`${CARD} p-4`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Contextual scope
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Network scope
            </span>
            <select
              className={selectClass}
              value={venue}
              onChange={(e) => setVenue(e.target.value as NetworkVenueKey)}
            >
              {NETWORK_VENUES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Brand partner scope
            </span>
            <select
              className={selectClass}
              value={partner}
              onChange={(e) => setPartner(e.target.value as BrandPartnerKey)}
            >
              {BRAND_PARTNER_SCOPES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Timeframe
            </span>
            <select
              className={selectClass}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeframeKey)}
            >
              {TIMEFRAMES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-cyan-400" /> Total alcohol GMV
          </p>
          <p className="mt-3 font-display text-3xl text-cyan-400">{formatINR(kpis.gmv)}</p>
          <span className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            +18.4% MTD
          </span>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <Droplets className="h-3.5 w-3.5 text-violet-400" /> Live pours &amp; bottles
          </p>
          <p className="mt-3 font-display text-3xl text-amber-400">{kpis.pours}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {kpis.bottles.toFixed(1)} bottles depleted
          </p>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <Gauge className="h-3.5 w-3.5 text-amber-400" /> Avg pour-cost
          </p>
          <p className="mt-3 font-display text-3xl text-amber-400">
            {kpis.avgCost.toFixed(1)}%
          </p>
          <span className="mt-2 inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            Target &lt; 22%
          </span>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-cyan-400" /> mAI Saarthi conversion
          </p>
          <p className="mt-3 font-display text-3xl text-cyan-400">14.6%</p>
          <p className="mt-2 text-sm text-zinc-400">Nudge → booked chauffeur</p>
        </div>
      </div>

      <div className={`${CARD} min-h-[340px]`}>
        <h2 className="text-sm font-semibold text-zinc-100">
          Hourly consumption velocity
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Volume throughput in Standard Pours (30ml units) across operational hours.
          Pre-midnight beer &amp; cocktails; 11:30 PM–2:00 AM tequila &amp; single malts
          spike 4.5×; post 2:00 AM premium hydration &amp; digestifs.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="gBeer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CYAN} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gCocktails" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gTequila" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AMBER} stopOpacity={0.75} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gMalts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e879f9" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#e879f9" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gHydration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMERALD} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={EMERALD} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke="#a1a1aa" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <YAxis stroke="#a1a1aa" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ color: "#e4e4e7" }} />
              <Area type="monotone" dataKey="beer" name="Beer & cocktails" stackId="1" stroke={CYAN} fill="url(#gBeer)" />
              <Area type="monotone" dataKey="cocktails" name="Mixed cocktails" stackId="1" stroke={VIOLET} fill="url(#gCocktails)" />
              <Area type="monotone" dataKey="tequila" name="Tequila shots" stackId="1" stroke={AMBER} fill="url(#gTequila)" />
              <Area type="monotone" dataKey="malts" name="Single malts" stackId="1" stroke="#e879f9" fill="url(#gMalts)" />
              <Area type="monotone" dataKey="hydration" name="Hydration / digestifs" stackId="1" stroke={EMERALD} fill="url(#gHydration)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className="text-sm font-semibold text-zinc-100">
            Strategic brand share of throat
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Volume % vs gross billed revenue (₹) by parent conglomerate.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SHARE_TABS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setCategory(f)}
                className={`rounded-full border px-3 py-1 text-[11px] ${
                  category === f
                    ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={share}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {share.map((s) => (
                    <Cell key={s.name} fill={COMPANY_COLORS[s.name] || CYAN} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => {
                    const payload = item?.payload as {
                      revenue?: number;
                      sku?: string;
                      value?: number;
                    };
                    return [
                      `${value}% · ${payload?.revenue != null ? formatINR(payload.revenue) : ""} · SKU ${payload?.sku ?? ""}`,
                      String(name),
                    ];
                  }}
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #3f3f46",
                    borderRadius: 12,
                    color: "#fafafa",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
            {share.map((s) => (
              <li key={s.name} className="flex justify-between gap-3">
                <span>
                  {s.name} · {s.sku}
                </span>
                <span className="text-zinc-100">
                  {s.value}% · {formatINR(s.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-zinc-100">
            Inventory velocity &amp; leakage radar
          </h2>
          <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
            <li>
              <span className="font-semibold text-emerald-400">Fast-Moving Velocity (Green):</span>{" "}
              Bottles poured in last 24 hours.
            </li>
            <li>
              <span className="font-semibold text-violet-400">Dead Stock Warning (Purple):</span>{" "}
              Bottles unpoured for &gt; 21 days (capital locked).
            </li>
            <li>
              <span className="font-semibold text-rose-400">Pour Variance / Spill Leakage (Red):</span>{" "}
              Volume discrepancy (ml lost) between KDS billed orders vs bottle decanting weights.
            </li>
          </ul>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INVENTORY_ROWS}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 9, fill: "#a1a1aa" }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <Tooltip content={<DarkTooltip />} />
                <Legend />
                <Bar dataKey="fast" name="Fast-moving" fill={EMERALD} radius={4} />
                <Bar dataKey="dead" name="Dead stock" fill={VIOLET} radius={4} />
                <Bar dataKey="variance" name="Pour variance" fill={ROSE} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Estimated pour leakage rate:{" "}
            <span className="font-semibold text-emerald-400">1.4%</span>{" "}
            (Industry benchmark: 4–6%).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
          AI Sommelier · predictive stockout
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-200 sm:text-base">
          Don Julio 1942 &amp; Talisker 10YO are consuming at 3.8× normal pace.
          Projected stock depletion at 11:45 PM. 1-Tap Purchase Requisition ready
          for Distributor Dispatch.
        </p>
        <button
          type="button"
          onClick={() =>
            setDraftNote("Purchase requisition queued · bonded warehouse dispatch ETA 42 min")
          }
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          1-tap emergency draft purchase
        </button>
        {draftNote ? (
          <p className="mt-3 text-xs font-medium text-emerald-300">{draftNote}</p>
        ) : null}
      </div>
      </div>
    </div>
  );
}

export default DarkGlassTelemetry;
