import type { DemoVenue } from "@/lib/demo/venues";

export type FlashAudience = "CHECKED_IN" | "GEO_GLOBAL";

export interface FlashCampaign {
  id: string;
  venue_id: string;
  title: string;
  category: string;
  audience: FlashAudience;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  credit_cost: number;
  status: "ACTIVE" | "ENDED" | "CANCELLED";
}

/** Platform SaaS pricing — geo broadcast burns promo credits */
export const GEO_FLASH_CREDIT_COST = 250;
export const CHECKED_IN_FLASH_CREDIT_COST = 0;

const memoryCampaigns: FlashCampaign[] = [];
const creditBalances = new Map<string, number>();

export function getCreditBalance(
  venue: DemoVenue,
  override?: Map<string, number>
): number {
  const map = override ?? creditBalances;
  if (!map.has(venue.id)) map.set(venue.id, venue.credit_balance);
  return map.get(venue.id) ?? venue.credit_balance;
}

export function setCreditBalance(venueId: string, balance: number) {
  creditBalances.set(venueId, balance);
}

export function listActiveCampaigns(venueId: string): FlashCampaign[] {
  const now = Date.now();
  return memoryCampaigns.filter(
    (c) =>
      c.venue_id === venueId &&
      c.status === "ACTIVE" &&
      new Date(c.ends_at).getTime() > now
  );
}

export function createFlashCampaignDemo(input: {
  venue: DemoVenue;
  title: string;
  category: string;
  audience: FlashAudience;
  duration_minutes: number;
}):
  | { ok: true; campaign: FlashCampaign; credit_balance: number }
  | { ok: false; reason: string } {
  const cost =
    input.audience === "GEO_GLOBAL"
      ? GEO_FLASH_CREDIT_COST
      : CHECKED_IN_FLASH_CREDIT_COST;

  const balance = getCreditBalance(input.venue);
  if (balance < cost) {
    return {
      ok: false,
      reason: `Insufficient Platform Promo Credits (have ₹${balance}, need ₹${cost}). Top up via Automated Direct-Settlement Gateway.`,
    };
  }

  const starts = new Date();
  const ends = new Date(starts.getTime() + input.duration_minutes * 60_000);
  const campaign: FlashCampaign = {
    id: `flash-${crypto.randomUUID()}`,
    venue_id: input.venue.id,
    title: input.title,
    category: input.category.toUpperCase(),
    audience: input.audience,
    duration_minutes: input.duration_minutes,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    credit_cost: cost,
    status: "ACTIVE",
  };

  const next = balance - cost;
  setCreditBalance(input.venue.id, next);
  memoryCampaigns.unshift(campaign);
  return { ok: true, campaign, credit_balance: next };
}

export function topUpCreditsDemo(
  venue: DemoVenue,
  amount: number
): { ok: true; credit_balance: number } {
  const next = getCreditBalance(venue) + amount;
  setCreditBalance(venue.id, next);
  venue.credit_balance = next;
  return { ok: true, credit_balance: next };
}
