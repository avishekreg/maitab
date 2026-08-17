import type { KpiDrillContent } from "@/components/admin/KpiDrillDrawer";
import { DEMO_PROPERTY_VENUES } from "@/lib/demo/venues";
import { INVENTORY_ROWS } from "@/lib/analytics/liquor-telemetry";
import { formatINR } from "@/lib/utils";

const VENUE_NETWORK = [
  ...DEMO_PROPERTY_VENUES.map((v) => ({
    name: v.short_name,
    gmv: v.live_gmv,
    tabs: Math.round(v.live_gmv / 4200),
    status: "Live",
  })),
  ...Array.from({ length: 40 }, (_, i) => ({
    name: `Partner Club ${String(i + 3).padStart(2, "0")}`,
    gmv: 42000 + (i % 7) * 8900,
    tabs: 18 + (i % 11),
    status: i % 5 === 0 ? "Pre-book buffer" : "Live",
  })),
];

export function commandCenterDrill(
  id: string,
  ctx: { totalGmv: number; activeClubs: number; fraudCount: number; radiusKm: string }
): KpiDrillContent | null {
  if (id === "platform-gmv") {
    const top = VENUE_NETWORK.slice(0, 8);
    return {
      title: "Gross Settlement Audit Log",
      subtitle: "Venue-by-venue GMV contribution, gateway fees, and net payouts",
      table: {
        headers: ["Venue", "Gross GMV", "Gateway fee", "Net payout"],
        rows: top.map((v) => [
          v.name,
          formatINR(v.gmv),
          formatINR(Math.round(v.gmv * 0.018)),
          formatINR(Math.round(v.gmv * 0.982)),
        ]),
      },
      rows: [
        { label: "Network gross", value: formatINR(ctx.totalGmv) },
        { label: "Settlement window", value: "Tonight · T+1 batch" },
        { label: "Primary gateway", value: "Razorpay Route · Cashfree backup" },
      ],
    };
  }
  if (id === "active-clubs") {
    return {
      title: "Live Venue Network Switcher",
      subtitle: `${ctx.activeClubs} partner clubs · occupants & active tabs`,
      table: {
        headers: ["Venue", "Status", "Active tabs", "Tonight GMV"],
        rows: VENUE_NETWORK.slice(0, 12).map((v) => [
          v.name,
          v.status,
          String(v.tabs),
          formatINR(v.gmv),
        ]),
      },
    };
  }
  if (id === "fraud-24h") {
    return {
      title: "Fraud & Security Telemetry Log",
      subtitle: `${ctx.fraudCount} flagged events in the last 24 hours`,
      table: {
        headers: ["Event", "Severity", "Detail"],
        rows: [
          ["Promo lockout", "High", "BEER promo blocked within 1.5km of competitor"],
          ["Geo settle exit", "Medium", "Session exited 50m fence after sustained distance gain"],
          ["QR token mismatch", "High", "Cryptographic seal mismatch on table token"],
          ["AutoPay mandate fail", "High", "Micro-hold declined for mandate_fail_demo"],
        ],
      },
    };
  }
  if (id === "lockout") {
    return {
      title: "Geofence & Competitor Lockout Matrix",
      subtitle: `Active radius ${ctx.radiusKm} km · competitor promo suppression`,
      rows: [
        { label: "Neon District", value: "1.5 km", hint: "BEER flash lockout active vs 2 rivals" },
        { label: "Neon Sky Lounge", value: "1.2 km", hint: "Rooftop perimeter fence" },
        { label: "Mirage Rooftop", value: "2.0 km", hint: "Extended weekend buffer" },
      ],
      table: {
        headers: ["Competitor", "Distance", "Promo lock", "Last trigger"],
        rows: [
          ["Skyline Social", "0.8 km", "Active", "22:14 IST"],
          ["The Warehouse", "1.1 km", "Active", "21:02 IST"],
          ["Blue Room", "2.4 km", "Clear", "—"],
        ],
      },
    };
  }
  return null;
}

export function telemetryDrill(
  id: string,
  ctx: { gmv: number; pours: number; bottles: number; avgCost: number }
): KpiDrillContent | null {
  if (id === "alcohol-gmv") {
    return {
      title: "Category-Wise Revenue & Margin Ledger",
      subtitle: "Tonight · gross billed vs pour-cost margin",
      table: {
        headers: ["Category", "GMV", "Margin %", "Pours"],
        rows: [
          ["Single Malts", formatINR(ctx.gmv * 0.31), "72%", "118"],
          ["Tequila / Agave", formatINR(ctx.gmv * 0.24), "68%", "96"],
          ["Craft Gin", formatINR(ctx.gmv * 0.12), "65%", "52"],
          ["Draught Beer", formatINR(ctx.gmv * 0.18), "58%", "84"],
          ["Cocktails", formatINR(ctx.gmv * 0.15), "61%", "70"],
        ],
      },
    };
  }
  if (id === "live-pours") {
    return {
      title: "Real-Time Bottle Decanting Log",
      subtitle: `${ctx.pours} pours · ${ctx.bottles.toFixed(1)} bottles depleted tonight`,
      table: {
        headers: ["SKU", "Bartender", "Time", "Volume"],
        rows: [
          ["Don Julio 1942", "Ravi Bar", "11:42 PM", "60ml"],
          ["Talisker 10YO", "Priya N.", "11:38 PM", "30ml"],
          ["Grey Goose", "Arjun M.", "11:31 PM", "30ml"],
          ["Kingfisher Ultra", "Ravi Bar", "11:28 PM", "330ml"],
          ["Bombay Sapphire", "Priya N.", "11:22 PM", "30ml"],
        ],
      },
    };
  }
  if (id === "pour-cost") {
    return {
      title: "Pour-Cost Variance & Spill Audit",
      subtitle: `Network average ${ctx.avgCost.toFixed(1)}% · target < 22%`,
      table: {
        headers: ["SKU", "Target %", "Actual %", "Variance ml"],
        rows: INVENTORY_ROWS.slice(0, 5).map((r) => [
          r.name,
          "18.0%",
          `${(17.2 + r.variance * 0.3).toFixed(1)}%`,
          `${r.variance} ml`,
        ]),
      },
      rows: [
        { label: "Estimated leakage", value: "1.4%", hint: "Industry benchmark 4–6%" },
      ],
    };
  }
  if (id === "saarthi-conversion") {
    return {
      title: "mAI Saarthi Transit & Valet Handshakes",
      subtitle: "14.6% high-pour sessions transitioning to chauffeurs",
      table: {
        headers: ["Guest", "Chauffeur", "Status", "ETA"],
        rows: [
          ["Rahul K.", "Suresh · Sedan", "En route", "6 min"],
          ["Ananya P.", "Vikram · SUV", "At valet", "Ready"],
          ["Dev M.", "Pending dispatch", "Queued", "12 min"],
        ],
      },
      rows: [
        { label: "Active transit sessions", value: "18" },
        { label: "Completed tonight", value: "42" },
        { label: "Valet handshakes", value: "36 verified" },
      ],
    };
  }
  return null;
}
