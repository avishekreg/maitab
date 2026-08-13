import { DEMO_CLUB } from "@/lib/demo/data";
import { NEON_CLUB_ID, NEON_SKY_CLUB_ID } from "@/lib/supabase/env";

export interface DemoVenue {
  id: string;
  name: string;
  short_name: string;
  owner_group_id: string;
  credit_balance: number;
  subscription_tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  live_gmv: number;
}

export const NEON_OWNER_GROUP_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

/** Multi-property portfolio under one group owner login */
export const DEMO_PROPERTY_VENUES: DemoVenue[] = [
  {
    id: NEON_CLUB_ID,
    name: DEMO_CLUB.name,
    short_name: "Neon District Main",
    owner_group_id: NEON_OWNER_GROUP_ID,
    credit_balance: 5000,
    subscription_tier: "GROWTH",
    live_gmv: 184200,
  },
  {
    id: NEON_SKY_CLUB_ID,
    name: "Neon Sky Lounge",
    short_name: "Neon Sky Lounge",
    owner_group_id: NEON_OWNER_GROUP_ID,
    credit_balance: 2500,
    subscription_tier: "ENTERPRISE",
    live_gmv: 96200,
  },
];

export function venueById(id: string): DemoVenue | undefined {
  return DEMO_PROPERTY_VENUES.find((v) => v.id === id);
}
