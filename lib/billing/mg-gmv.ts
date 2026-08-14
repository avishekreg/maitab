import { DEMO_CLUB } from "@/lib/demo/data";
import { NEON_CLUB_ID, NEON_SKY_CLUB_ID } from "@/lib/supabase/env";

/** Minimum Guarantee vs GMV take-rate offset billing. */

export type PlanId = "starter" | "pro" | "enterprise";

export interface PlatformPlan {
  id: PlanId;
  plan_name: string;
  default_base_mg: number;
  default_gmv_percent: number;
  features: Record<string, unknown>;
}

export interface VenueBillingOverride {
  venue_id: string;
  venue_name: string;
  plan_id: PlanId;
  custom_base_mg: number | null;
  custom_gmv_percent: number | null;
  is_custom_deal: boolean;
  live_gmv: number;
}

export interface MgGmvInvoicePreview {
  total_gmv: number;
  effective_base_mg: number;
  effective_gmv_percent: number;
  calculated_gmv_cut: number;
  final_payable_amount: number;
  binding_leg: "MG" | "GMV";
}

export const PLATFORM_PLANS: PlatformPlan[] = [
  {
    id: "starter",
    plan_name: "Starter · Single Venue",
    default_base_mg: 19999,
    default_gmv_percent: 10,
    features: { venues: 1, routing: false },
  },
  {
    id: "pro",
    plan_name: "Pro · Multi-Venue & Routing",
    default_base_mg: 29999,
    default_gmv_percent: 8,
    features: { venues: "multi", routing: true },
  },
  {
    id: "enterprise",
    plan_name: "Enterprise Group · Annual SLA",
    default_base_mg: 0,
    default_gmv_percent: 0,
    features: { sla: true, custom: true },
  },
];

let overrides: VenueBillingOverride[] = [
  {
    venue_id: NEON_CLUB_ID,
    venue_name: DEMO_CLUB.name,
    plan_id: "pro",
    custom_base_mg: null,
    custom_gmv_percent: null,
    is_custom_deal: false,
    live_gmv: 184200,
  },
  {
    venue_id: NEON_SKY_CLUB_ID,
    venue_name: "Neon Sky Lounge",
    plan_id: "enterprise",
    custom_base_mg: 45000,
    custom_gmv_percent: 5,
    is_custom_deal: true,
    live_gmv: 96200,
  },
];

export function listPlatformPlans(): PlatformPlan[] {
  return PLATFORM_PLANS.map((p) => ({ ...p }));
}

export function listVenueBillingOverrides(): VenueBillingOverride[] {
  return overrides.map((o) => ({ ...o }));
}

export function upsertVenueBillingOverride(
  patch: Partial<VenueBillingOverride> & { venue_id: string }
): VenueBillingOverride {
  const idx = overrides.findIndex((o) => o.venue_id === patch.venue_id);
  if (idx < 0) {
    const created: VenueBillingOverride = {
      venue_id: patch.venue_id,
      venue_name: patch.venue_name ?? "Venue",
      plan_id: patch.plan_id ?? "starter",
      custom_base_mg: patch.custom_base_mg ?? null,
      custom_gmv_percent: patch.custom_gmv_percent ?? null,
      is_custom_deal: Boolean(patch.is_custom_deal),
      live_gmv: patch.live_gmv ?? 0,
    };
    overrides = [created, ...overrides];
    return { ...created };
  }
  overrides[idx] = { ...overrides[idx]!, ...patch };
  return { ...overrides[idx]! };
}

export function effectiveBillingRates(venue: VenueBillingOverride): {
  effective_base_mg: number;
  effective_gmv_percent: number;
} {
  const plan =
    PLATFORM_PLANS.find((p) => p.id === venue.plan_id) ?? PLATFORM_PLANS[0]!;
  if (venue.is_custom_deal) {
    return {
      effective_base_mg: venue.custom_base_mg ?? plan.default_base_mg,
      effective_gmv_percent:
        venue.custom_gmv_percent ?? plan.default_gmv_percent,
    };
  }
  return {
    effective_base_mg: plan.default_base_mg,
    effective_gmv_percent: plan.default_gmv_percent,
  };
}

/** final_payable = GREATEST(effective_base_mg, total_gmv * percent / 100) */
export function computeMgGmvInvoice(
  venue: VenueBillingOverride,
  totalGmv = venue.live_gmv
): MgGmvInvoicePreview {
  const { effective_base_mg, effective_gmv_percent } =
    effectiveBillingRates(venue);
  const calculated_gmv_cut = Math.round(
    (totalGmv * effective_gmv_percent) / 100
  );
  const final_payable_amount = Math.max(effective_base_mg, calculated_gmv_cut);
  return {
    total_gmv: totalGmv,
    effective_base_mg,
    effective_gmv_percent,
    calculated_gmv_cut,
    final_payable_amount,
    binding_leg:
      calculated_gmv_cut > effective_base_mg ? "GMV" : "MG",
  };
}
