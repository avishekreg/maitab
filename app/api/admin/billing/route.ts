import { NextResponse, type NextRequest } from "next/server";
import {
  computeMgGmvInvoice,
  listPlatformPlans,
  listVenueBillingOverrides,
  upsertVenueBillingOverride,
  type PlanId,
} from "@/lib/billing/mg-gmv";

export async function GET(request: NextRequest) {
  const venueId = request.nextUrl.searchParams.get("venueId");
  const venues = listVenueBillingOverrides();
  const venue = venueId
    ? venues.find((v) => v.venue_id === venueId) ?? null
    : null;

  return NextResponse.json({
    ok: true,
    plans: listPlatformPlans(),
    venues,
    preview: venue ? computeMgGmvInvoice(venue) : null,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    venue_id?: string;
    venue_name?: string;
    plan_id?: PlanId;
    custom_base_mg?: number | null;
    custom_gmv_percent?: number | null;
    is_custom_deal?: boolean;
    live_gmv?: number;
  };

  if (!body.venue_id) {
    return NextResponse.json(
      { ok: false, reason: "venue_id required" },
      { status: 400 }
    );
  }

  const venue = upsertVenueBillingOverride({
    venue_id: body.venue_id,
    venue_name: body.venue_name,
    plan_id: body.plan_id,
    custom_base_mg: body.custom_base_mg,
    custom_gmv_percent: body.custom_gmv_percent,
    is_custom_deal: body.is_custom_deal,
    live_gmv: body.live_gmv,
  });

  return NextResponse.json({
    ok: true,
    venue,
    preview: computeMgGmvInvoice(venue),
  });
}
