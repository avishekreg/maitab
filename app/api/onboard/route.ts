import { NextResponse } from "next/server";
import { DEMO_PROPERTY_VENUES, type DemoVenue } from "@/lib/demo/venues";
import { NEON_OWNER_GROUP_ID } from "@/lib/demo/venues";

export type SaasPlan = "STARTER" | "PRO" | "ENTERPRISE";

export interface OnboardPayload {
  plan: SaasPlan;
  venue_name: string;
  admin_name: string;
  admin_email: string;
  phone?: string;
  payment_ref?: string;
}

const PLAN_META: Record<
  SaasPlan,
  { monthly: number | null; gmv_pct: number; label: string }
> = {
  STARTER: { monthly: 19999, gmv_pct: 10, label: "Starter · Single Venue" },
  PRO: { monthly: 29999, gmv_pct: 8, label: "Pro · Multi-Venue & Routing" },
  ENTERPRISE: { monthly: null, gmv_pct: 0, label: "Enterprise Group · Annual SLA" },
};

/** In-memory provisioned workspaces for demo fallback. */
const provisioned: {
  id: string;
  plan: SaasPlan;
  venue: DemoVenue;
  admin_email: string;
  status: "KYC_PENDING" | "ACTIVE";
}[] = [];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<OnboardPayload>;

  if (!body.plan || !body.venue_name || !body.admin_email || !body.admin_name) {
    return NextResponse.json(
      { ok: false, reason: "plan, venue_name, admin_name, admin_email required" },
      { status: 400 }
    );
  }

  if (!["STARTER", "PRO", "ENTERPRISE"].includes(body.plan)) {
    return NextResponse.json(
      { ok: false, reason: "Invalid plan" },
      { status: 400 }
    );
  }

  const meta = PLAN_META[body.plan];
  const paymentRef =
    body.payment_ref ||
    `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)}`;

  // Simulate settlement capture (demo). Enterprise skips instant capture.
  if (body.plan !== "ENTERPRISE" && !paymentRef) {
    return NextResponse.json(
      { ok: false, reason: "Payment capture required" },
      { status: 402 }
    );
  }

  const clubId = `club-${crypto.randomUUID()}`;
  const venue: DemoVenue = {
    id: clubId,
    name: body.venue_name,
    short_name: body.venue_name.slice(0, 28),
    owner_group_id: NEON_OWNER_GROUP_ID,
    credit_balance: body.plan === "STARTER" ? 1000 : 5000,
    subscription_tier:
      body.plan === "STARTER"
        ? "STARTER"
        : body.plan === "PRO"
          ? "GROWTH"
          : "ENTERPRISE",
    live_gmv: 0,
  };

  // Keep demo portfolio discoverable in memory for this process.
  DEMO_PROPERTY_VENUES.push(venue);

  const record = {
    id: `onb-${crypto.randomUUID()}`,
    plan: body.plan,
    venue,
    admin_email: body.admin_email,
    status: "KYC_PENDING" as const,
  };
  provisioned.push(record);

  return NextResponse.json({
    ok: true,
    mode: "provisioned",
    payment_ref: paymentRef,
    plan: meta,
    workspace: {
      club_id: clubId,
      venue_name: venue.name,
      admin_email: body.admin_email,
      admin_name: body.admin_name,
      role: "CLUB_ADMIN",
      status: "KYC_PENDING",
    },
    redirect: `/onboard/kyc?club=${encodeURIComponent(clubId)}&email=${encodeURIComponent(body.admin_email)}`,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: PLAN_META,
    provisioned: provisioned.map((p) => ({
      id: p.id,
      plan: p.plan,
      venue: p.venue.short_name,
      admin_email: p.admin_email,
      status: p.status,
    })),
  });
}
