import { DEMO_CLUB } from "@/lib/demo/data";
import { NEON_CLUB_ID, NEON_SKY_CLUB_ID } from "@/lib/supabase/env";

export type ComplianceStatus = "ACTIVE" | "WARNING" | "SUSPENDED";

export interface VenueCompliance {
  venue_id: string;
  liquor_license_url: string | null;
  liquor_license_expiry: string | null;
  fssai_license_url: string | null;
  fssai_license_expiry: string | null;
  gstin: string | null;
  compliance_status: ComplianceStatus;
}

const memory = new Map<string, VenueCompliance>();

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seed(venueId: string): VenueCompliance {
  if (!memory.has(venueId)) {
    memory.set(venueId, {
      venue_id: venueId,
      liquor_license_url: null,
      liquor_license_expiry: daysFromNow(venueId === NEON_SKY_CLUB_ID ? 10 : 120),
      fssai_license_url: null,
      fssai_license_expiry: daysFromNow(90),
      gstin: "27AABCU9603R1ZM",
      compliance_status: "ACTIVE",
    });
  }
  return memory.get(venueId)!;
}

export function computeComplianceStatus(
  row: Pick<
    VenueCompliance,
    "liquor_license_expiry" | "fssai_license_expiry"
  >
): ComplianceStatus {
  const today = new Date().toISOString().slice(0, 10);
  const warn = new Date();
  warn.setDate(warn.getDate() + 15);
  const warnIso = warn.toISOString().slice(0, 10);

  const expired = [row.liquor_license_expiry, row.fssai_license_expiry].some(
    (d) => d && d < today
  );
  if (expired) return "SUSPENDED";

  const warning = [row.liquor_license_expiry, row.fssai_license_expiry].some(
    (d) => d && d <= warnIso
  );
  return warning ? "WARNING" : "ACTIVE";
}

export function getVenueCompliance(venueId = NEON_CLUB_ID || DEMO_CLUB.id) {
  const row = seed(venueId);
  row.compliance_status = computeComplianceStatus(row);
  return { ...row };
}

export function updateVenueCompliance(
  venueId: string,
  patch: Partial<VenueCompliance>
): VenueCompliance {
  const row = seed(venueId);
  Object.assign(row, patch, { venue_id: venueId });
  row.compliance_status = computeComplianceStatus(row);
  return { ...row };
}

export function isOrderingFrozen(venueId: string): boolean {
  return getVenueCompliance(venueId).compliance_status === "SUSPENDED";
}

export const COMPLIANCE_BANNER =
  "Operations Suspended due to Expired License. Upload renewal to resume.";
