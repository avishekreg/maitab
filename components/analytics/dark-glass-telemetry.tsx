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
import { Activity, Droplets, Gauge, Shield } from "lucide-react";
import { DEMO_TELEMETRY, type SpiritCategory } from "@/lib/analytics/liquor-telemetry";
import { formatINR } from "@/lib/utils";

const CARD =
  "bg-zinc-950/80 border border-zinc-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]";

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

const HOUR_ORDER = [20, 21, 22, 23, 0, 1, 2, 3, 4];

function hourLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

const FILTERS: Array<"All" | SpiritCategory> = [
  "All",
  "Whisky",
  "Vodka",
  "Tequila",
  "Gin",
  "Beer",
];

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

export function DarkGlassTelemetry({
  scope = "network",
  title,
}: {
  scope?: "network" | "venue" | "partner";
  title?: string;
}) {
  const [category, setCategory] = useState<(typeof FILTERS)[number]>("All");
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const rows = DEMO_TELEMETRY;

  const kpis = useMemo(() => {
    const gmv = rows.reduce((s, r) => s + r.billed_amount, 0);
    const pours = rows.length;
    const ml = rows.reduce((s, r) => s + r.volume_ml, 0);
    const bottles = ml / 750;
    const avgCost =
      rows.reduce((s, r) => s + r.pour_cost_pct, 0) / Math.max(pours, 1);
    return { gmv, pours, bottles, avgCost };
  }, [rows]);

  const hourly = useMemo(() => {
    return HOUR_ORDER.map((hour) => {
      const slice = rows.filter((r) => r.pour_hour === hour);
      const spirits = slice.filter((r) =>
        ["Whisky", "Vodka", "Gin", "Wine"].includes(r.spirit_category)
      ).length;
      const tequila = slice.filter((r) => r.spirit_category === "Tequila").length;
      const beers = slice.filter((r) => r.spirit_category === "Beer").length;
      return { hour: hourLabel(hour), spirits, tequila, beers };
    });
  }, [rows]);

  const share = useMemo(() => {
    const filtered =
      category === "All"
        ? rows
        : rows.filter((r) => r.spirit_category === category);
    const byCompany = new Map<string, { revenue: number; volume: number }>();
    for (const r of filtered) {
      const cur = byCompany.get(r.parent_company) ?? { revenue: 0, volume: 0 };
      cur.revenue += r.billed_amount;
      cur.volume += r.volume_ml;
      byCompany.set(r.parent_company, cur);
    }
    const totalVol = Array.from(byCompany.values()).reduce((s, v) => s + v.volume, 0);
    return Array.from(byCompany.entries()).map(([name, v]) => ({
      name,
      value: Number(((v.volume / Math.max(totalVol, 1)) * 100).toFixed(1)),
      revenue: v.revenue,
    }));
  }, [rows, category]);

  const inventory = useMemo(() => {
    const byBrand = new Map<string, number>();
    for (const r of rows) {
      byBrand.set(r.brand_name, (byBrand.get(r.brand_name) ?? 0) + 1);
    }
    return [
      { name: "Johnnie Walker", fast: 42, dead: 4, variance: 6 },
      { name: "Grey Goose", fast: 31, dead: 8, variance: 4 },
      { name: "Don Julio", fast: 38, dead: 3, variance: 11 },
      { name: "Bombay Sapphire", fast: 22, dead: 14, variance: 5 },
      { name: "Kingfisher Ultra", fast: 48, dead: 2, variance: 3 },
    ];
  }, [rows]);

  const heading =
    title ||
    (scope === "partner"
      ? "Brand executive liquor intelligence"
      : scope === "venue"
        ? "Venue liquor telemetry"
        : "Network liquor telemetry");

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Alcohol consumption engine
        </p>
        <h1 className="mt-1 font-display text-3xl text-white">{heading}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <Activity className="h-3.5 w-3.5 text-cyan-400" /> Total alcohol GMV
          </p>
          <p className="mt-3 font-display text-3xl text-white">{formatINR(kpis.gmv)}</p>
          <span className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            +18.4% MTD
          </span>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <Droplets className="h-3.5 w-3.5 text-violet-400" /> Live pours tonight
          </p>
          <p className="mt-3 font-display text-3xl text-white">{kpis.pours}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {kpis.bottles.toFixed(1)} bottles depleted
          </p>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <Gauge className="h-3.5 w-3.5 text-amber-400" /> Avg pour-cost
          </p>
          <p className="mt-3 font-display text-3xl text-white">
            {kpis.avgCost.toFixed(1)}%
          </p>
          <span className="mt-2 inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            Target &lt; 22%
          </span>
        </div>
        <div className={CARD}>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-cyan-400" /> mAI Saarthi conversion
          </p>
          <p className="mt-3 font-display text-3xl text-white">14.6%</p>
          <p className="mt-2 text-sm text-zinc-400">Nudge → booked chauffeur</p>
        </div>
      </div>

      <div className={`${CARD} min-h-[320px]`}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Hourly consumption velocity · 8:00 PM – 4:00 AM
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="gSpirits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gTequila" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AMBER} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gBeer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CYAN} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
              <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} />
              <Tooltip content={<DarkTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="spirits"
                name="Spirits"
                stackId="1"
                stroke={VIOLET}
                fill="url(#gSpirits)"
              />
              <Area
                type="monotone"
                dataKey="tequila"
                name="Tequila"
                stackId="1"
                stroke={AMBER}
                fill="url(#gTequila)"
              />
              <Area
                type="monotone"
                dataKey="beers"
                name="Beers / Hydration"
                stackId="1"
                stroke={CYAN}
                fill="url(#gBeer)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Strategic brand share of throat
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
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
                    const rev = (item?.payload as { revenue?: number })?.revenue;
                    return [
                      `${value}% · ${rev != null ? formatINR(rev) : ""}`,
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
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Inventory velocity & bar leakage
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Legend />
                <Bar dataKey="fast" name="Fast-moving" fill={EMERALD} radius={4} />
                <Bar dataKey="dead" name="Dead stock" fill={VIOLET} radius={4} />
                <Bar dataKey="variance" name="Pour variance" fill={ROSE} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5 shadow-[0_0_30px_rgba(245,158,11,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          AI predictive inventory
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-50 sm:text-base">
          High-Velocity Stockout Forecast: Don Julio 1942 &amp; Jagermeister
          running at 3.2x normal rate. Projected stockout at 11:45 PM
        </p>
        <button
          type="button"
          onClick={() =>
            setDraftNote("Emergency draft PO queued to bonded warehouse · ETA 42 min")
          }
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950"
        >
          1-tap emergency draft purchase
        </button>
        {draftNote ? (
          <p className="mt-3 text-xs text-emerald-300">{draftNote}</p>
        ) : null}
      </div>
    </div>
  );
}

export default DarkGlassTelemetry;
