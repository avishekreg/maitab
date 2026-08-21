import type { KpiDrillContent } from "@/components/admin/KpiDrillDrawer";
import { INVENTORY_ROWS } from "@/lib/analytics/liquor-telemetry";
import {
  DEMO_GATE_EVENTS,
  DEMO_ORDERS,
  DEMO_SESSION,
  DEMO_TABLES,
} from "@/lib/demo/data";
import { DEMO_PROPERTY_VENUES } from "@/lib/demo/venues";
import { DEMO_BAR_COUNTERS } from "@/lib/kds/routing";
import {
  DEMO_BARTENDER_SHIFTS,
  DEMO_CLUB_ZONES,
  DEMO_WAITER_SHIFTS,
} from "@/lib/waiter/allocation";
import { formatINR } from "@/lib/utils";
import type { GateEntryEvent, Order } from "@/lib/types";

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
      role: "SUPER_ADMIN",
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
      role: "SUPER_ADMIN",
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
      role: "SUPER_ADMIN",
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
      role: "SUPER_ADMIN",
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
      role: "TELEMETRY",
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
      role: "TELEMETRY",
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
      role: "TELEMETRY",
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
      title: "mAISaarthi Transit & Valet Handshakes",
      subtitle: "14.6% high-pour sessions transitioning to chauffeurs",
      role: "TELEMETRY",
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

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function minutesAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return `${m}m`;
}

function paymentMode(order: Order) {
  if (order.status === "READY") return "AutoPay";
  if (order.items.some((i) => i.category === "COCKTAIL")) return "UPI";
  return "Card";
}

function autopayStatus(order: Order) {
  if (order.status === "READY") return "Settled";
  if (order.status === "PREPARING") return "Hold captured";
  return "Pending mandate";
}

export function clubAdminDrill(
  id: string,
  ctx: { gmv: number; credits: number; openSession: number; floorLive: boolean }
): KpiDrillContent | null {
  if (id === "live-gmv") {
    return {
      title: "Venue Revenue & Settlement Ledger",
      subtitle: "Order-by-order gross, payment mode, AutoPay settlement",
      role: "CLUB_ADMIN",
      rows: [
        { label: "Live GMV", value: formatINR(ctx.gmv) },
        { label: "Open session unbilled", value: formatINR(ctx.openSession) },
        { label: "Settlement rail", value: "Razorpay Route · T+1" },
      ],
      table: {
        headers: ["Order", "Items", "Gross", "Mode", "AutoPay"],
        rows: DEMO_ORDERS.map((o) => [
          `#${o.token_number}`,
          o.items.map((i) => `${i.quantity}× ${i.name}`).join(", "),
          formatINR(o.total_amount),
          paymentMode(o),
          autopayStatus(o),
        ]),
      },
    };
  }
  if (id === "promo-credits") {
    return {
      title: "Active Flash Campaign Performance",
      subtitle: `${formatINR(ctx.credits)} promo credit wallet remaining`,
      role: "CLUB_ADMIN",
      rows: [
        { label: "Credit wallet", value: formatINR(ctx.credits) },
        { label: "Campaigns live", value: "3" },
        { label: "Blended ROI", value: "3.4×", hint: "Incremental GMV / credit burn" },
      ],
      table: {
        headers: ["Campaign", "Claims", "Geo-push redemptions", "ROI"],
        rows: [
          ["BEER flash · Heineken", "48", "31", "3.2×"],
          ["Lucky Draw hourly", "12", "—", "2.1×"],
          ["VIP tequila push", "9", "7", "4.6×"],
        ],
      },
    };
  }
  if (id === "open-session") {
    return {
      title: "Live Active Table Sessions",
      subtitle: "Occupancy, duration, and current unbilled amount",
      role: "CLUB_ADMIN",
      rows: [
        {
          label: "Host session B4",
          value: formatINR(ctx.openSession),
          hint: `${minutesAgo(DEMO_SESSION.started_at)} open · ${DEMO_SESSION.status}`,
        },
      ],
      table: {
        headers: ["Table", "Status", "Duration", "Unbilled"],
        rows: DEMO_TABLES.filter((t) => t.status !== "MERGED_CHILD").map((t) => {
          const occupied = t.status === "MERGED_PARENT" || t.status === "OCCUPIED";
          return [
            t.table_code,
            t.status.replaceAll("_", " "),
            occupied ? minutesAgo(DEMO_SESSION.started_at) : t.status === "PRE_BOOKED" ? "Arriving 25m" : "Idle",
            occupied ? formatINR(ctx.openSession) : "—",
          ];
        }),
      },
    };
  }
  if (id === "floor-status") {
    return {
      title: "Real-Time Zone Occupancy Map",
      subtitle: ctx.floorLive ? "AV displays live" : "Floor displays hidden",
      role: "CLUB_ADMIN",
      rows: [
        { label: "VIP Lounge", value: "18 guests", hint: "Tables V1–V3 · 72% occupied" },
        { label: "Main Floor", value: "64 guests", hint: "Tables B1–B10 · 80% occupied" },
        { label: "Bar Counter", value: "22 guests", hint: "Standing + stools" },
      ],
      table: {
        headers: ["Zone", "Headcount", "Capacity", "Load"],
        rows: [
          ["VIP Lounge", "18", "25", "72%"],
          ["Main Floor", "64", "80", "80%"],
          ["Bar Counter", "22", "30", "73%"],
        ],
      },
    };
  }
  return null;
}

export function managerDrill(
  id: string,
  ctx: { activeWaiters: number; zoneCount: number; barCount: number }
): KpiDrillContent | null {
  if (id === "active-tables") {
    return {
      title: "Table Turn-Time & Bill Status",
      subtitle: "Assigned waiter, last order, idle-table alerts",
      role: "FLOOR_MANAGER",
      table: {
        headers: ["Table", "Waiter", "Last order", "Bill", "Alert"],
        rows: [
          ["B4 cluster", "Priya Nair", "4m ago", "Open", "—"],
          ["B2", "Priya Nair", "—", "Clear", "Idle 18m"],
          ["V1", "Arjun Mehta", "Pre-book", "Hold", "Arriving 25m"],
          ["B6", "Priya Nair", "Merged → B4", "Hosted", "—"],
        ],
      },
    };
  }
  if (id === "service-calls") {
    return {
      title: "Guest Assistance Request Queue",
      subtitle: "Water, cutlery, and bill requests with response latency",
      role: "FLOOR_MANAGER",
      rows: [
        { label: "Open calls", value: "3" },
        { label: "Median response", value: "1m 08s" },
      ],
      table: {
        headers: ["Table", "Request", "Wait", "Assigned"],
        rows: [
          ["B4", "Water", "1m 12s", "Priya Nair"],
          ["V1", "Bill", "0m 48s", "Arjun Mehta"],
          ["B6", "Cutlery", "2m 04s", "Priya Nair"],
        ],
      },
    };
  }
  if (id === "staff-duty") {
    const waiters = DEMO_WAITER_SHIFTS.filter((w) => w.active_status);
    const bars = DEMO_BARTENDER_SHIFTS.filter((b) => b.active_status);
    return {
      title: "Roster & Zone Allocation",
      subtitle: `${ctx.activeWaiters} waiters · ${ctx.zoneCount} zones · ${ctx.barCount} bar counters · PIN logins`,
      role: "FLOOR_MANAGER",
      table: {
        headers: ["Staff", "Role", "Zone / counter", "PIN login", "Status"],
        rows: [
          ...waiters.map((w) => [
            w.waiter_name,
            "Waiter",
            DEMO_CLUB_ZONES.find((z) => z.id === w.assigned_zone_id)?.zone_name ?? "—",
            w.waiter_name.startsWith("Priya") ? "****4210" : "****8891",
            "On duty",
          ]),
          ...bars.map((b) => [
            b.bartender_name,
            "Bartender",
            DEMO_BAR_COUNTERS.find((c) => c.id === b.assigned_counter_id)?.counter_name ?? "—",
            b.bartender_name.startsWith("Ravi") ? "****3301" : "****7744",
            "On duty",
          ]),
        ],
      },
    };
  }
  return null;
}

export function kdsDrill(
  id: string,
  ctx: { pending: number; bottles: number; avgPrepMin: number }
): KpiDrillContent | null {
  if (id === "pending-tickets") {
    return {
      title: "Prioritized Drink Queue",
      subtitle: `${ctx.pending} open tickets grouped by spirit type`,
      role: "BARTENDER",
      table: {
        headers: ["Token", "Table / waiter", "Spirit type", "Wait", "Status"],
        rows: DEMO_ORDERS.filter((o) =>
          ["PENDING", "PREPARING", "READY"].includes(o.status)
        ).map((o) => [
          `#${o.token_number}`,
          o.assigned_waiter_name ?? "—",
          o.items[0]?.category ?? "MIX",
          minutesAgo(o.created_at),
          o.status,
        ]),
      },
    };
  }
  if (id === "bottles-depleted") {
    return {
      title: "Active Station Pour & Decanting Log",
      subtitle: `${ctx.bottles.toFixed(1)} bottles depleted · ml per SKU`,
      role: "BARTENDER",
      table: {
        headers: ["SKU", "ml decanted", "Open bottle level", "Station"],
        rows: INVENTORY_ROWS.slice(0, 6).map((r, i) => [
          r.name,
          `${r.fast * 30} ml`,
          `${Math.max(8, 100 - r.fast)}% remaining`,
          i % 2 === 0 ? "Main Bar 1" : "VIP Bar 2",
        ]),
      },
    };
  }
  if (id === "avg-prep") {
    return {
      title: "Speed-of-Service Analytics",
      subtitle: `Avg ticket prep ${ctx.avgPrepMin.toFixed(1)} min · by cocktail complexity`,
      role: "BARTENDER",
      table: {
        headers: ["Ticket class", "Complexity", "Target", "Actual"],
        rows: [
          ["Draught / bottled beer", "Low", "1.0 min", "0.8 min"],
          ["Well spirits + mixer", "Medium", "2.0 min", "1.7 min"],
          ["Classic cocktail", "High", "4.0 min", "3.6 min"],
          ["Shaken / layered", "Peak", "5.5 min", "5.1 min"],
        ],
      },
    };
  }
  return null;
}

function passType(tier: GateEntryEvent["spend_tier"]) {
  if (tier === "TITAN" || tier === "GOLD") return "VIP";
  if (tier === "SILVER") return "Member";
  return "General";
}

export function gateDrill(
  id: string,
  ctx: { entries: number; inside: number; capacity: number; denied: number }
): KpiDrillContent | null {
  if (id === "todays-entries") {
    const extras: string[][] = [
      ["21:04:11", "Dev Malhotra · 44ab12c0", "General", "Success", "GATE-3309"],
      ["21:18:33", "Meera Iyer · 9c81ff02", "Member", "Success", "GATE-4412"],
      ["21:42:07", "Kabir Singh · 71d0aa18", "VIP", "Success", "GATE-4412"],
      ["22:01:55", "Sana Qureshi · 08e3bb91", "General", "Success", "GATE-3309"],
    ];
    return {
      title: "Timestamped Guest Entry Log",
      subtitle: `${ctx.entries} verified entries tonight · no financial data`,
      role: "GATE_STAFF",
      table: {
        headers: ["Time", "Guest / ID", "Pass type", "Verification", "Scanner PIN"],
        rows: [
          ...DEMO_GATE_EVENTS.map((e) => [
            clock(e.created_at),
            `${e.guest_name} · ${e.user_id.slice(0, 8)}`,
            passType(e.spend_tier),
            "Success",
            "GATE-4412",
          ]),
          ...extras,
        ],
      },
    };
  }
  if (id === "inside-count") {
    const load = Math.round((ctx.inside / ctx.capacity) * 100);
    return {
      title: "In-Venue Headcount vs Licensed Capacity",
      subtitle: "Live occupancy · fire-code ceiling",
      role: "GATE_STAFF",
      rows: [
        { label: "Currently inside", value: String(ctx.inside) },
        { label: "Licensed capacity", value: String(ctx.capacity) },
        { label: "Load", value: `${load}%`, hint: load > 85 ? "Near ceiling" : "Within limit" },
      ],
      table: {
        headers: ["Zone", "Headcount", "Cap"],
        rows: [
          ["VIP Lounge", "18", "25"],
          ["Main Floor", "64", "80"],
          ["Bar / standing", "22", "30"],
          ["Queue / vestibule", String(Math.max(0, ctx.inside - 104)), "—"],
        ],
      },
    };
  }
  if (id === "denied-alerts") {
    return {
      title: "Timestamped Rejection Log",
      subtitle: `${ctx.denied} denied / fake-token alerts tonight`,
      role: "GATE_STAFF",
      table: {
        headers: ["Time", "Scan", "Reason", "Status", "Scanner PIN"],
        rows: [
          ["22:14:08", "QR · table token", "Invalid HMAC seal", "Denied", "GATE-4412"],
          ["22:31:44", "Member pass", "Age-restricted reject", "Denied", "GATE-4412"],
          ["22:48:02", "Replay QR", "Token already used", "Denied", "GATE-3309"],
        ],
      },
    };
  }
  return null;
}
