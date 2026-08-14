import { NextResponse, type NextRequest } from "next/server";
import {
  COMPLIANCE_BANNER,
  getVenueCompliance,
  updateVenueCompliance,
  type VenueCompliance,
} from "@/lib/compliance/watchdog";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const venueId =
    request.nextUrl.searchParams.get("venueId") || NEON_CLUB_ID;
  const row = getVenueCompliance(venueId);
  return NextResponse.json({
    ok: true,
    compliance: row,
    frozen: row.compliance_status === "SUSPENDED",
    banner:
      row.compliance_status === "SUSPENDED" ? COMPLIANCE_BANNER : null,
    warning:
      row.compliance_status === "WARNING"
        ? "License expires within 15 days — renew to avoid suspension."
        : null,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<VenueCompliance> & {
    venue_id?: string;
  };
  const venueId = body.venue_id || NEON_CLUB_ID;
  const row = updateVenueCompliance(venueId, body);
  return NextResponse.json({
    ok: true,
    compliance: row,
    frozen: row.compliance_status === "SUSPENDED",
    banner:
      row.compliance_status === "SUSPENDED" ? COMPLIANCE_BANNER : null,
  });
}
