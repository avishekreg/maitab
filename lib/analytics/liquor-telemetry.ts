import { NEON_CLUB_ID } from "@/lib/supabase/env";

export type SpiritCategory = "Whisky" | "Vodka" | "Tequila" | "Gin" | "Beer" | "Wine";

export type ParentCompany =
  | "Diageo"
  | "Pernod Ricard"
  | "Bacardi"
  | "AB InBev"
  | "Beam Suntory";

export interface ConsumptionTelemetry {
  id: string;
  venue_id: string;
  brand_name: string;
  parent_company: ParentCompany;
  spirit_category: SpiritCategory;
  volume_ml: number;
  billed_amount: number;
  pour_cost_pct: number;
  pour_hour: number;
  zone_name: "VIP Lounge" | "Main Floor" | "Rooftop Bar";
}

const CATALOG: {
  brand_name: string;
  parent_company: ParentCompany;
  spirit_category: SpiritCategory;
  volume_ml: number;
  billed_amount: number;
}[] = [
  {
    brand_name: "Johnnie Walker",
    parent_company: "Diageo",
    spirit_category: "Whisky",
    volume_ml: 30,
    billed_amount: 450,
  },
  {
    brand_name: "Grey Goose",
    parent_company: "Pernod Ricard",
    spirit_category: "Vodka",
    volume_ml: 30,
    billed_amount: 520,
  },
  {
    brand_name: "Don Julio Blanco",
    parent_company: "Diageo",
    spirit_category: "Tequila",
    volume_ml: 30,
    billed_amount: 680,
  },
  {
    brand_name: "Bombay Sapphire",
    parent_company: "Bacardi",
    spirit_category: "Gin",
    volume_ml: 30,
    billed_amount: 480,
  },
  {
    brand_name: "Kingfisher Ultra",
    parent_company: "AB InBev",
    spirit_category: "Beer",
    volume_ml: 330,
    billed_amount: 320,
  },
];

const HOURS = [20, 21, 22, 23, 0, 1, 2, 3, 4] as const;
const ZONES = ["VIP Lounge", "Main Floor", "Rooftop Bar"] as const;

export function buildDemoTelemetry(count = 150): ConsumptionTelemetry[] {
  return Array.from({ length: count }, (_, i) => {
    const g = i + 1;
    const brand = CATALOG[g % CATALOG.length];
    return {
      id: `tel-${String(g).padStart(3, "0")}`,
      venue_id: NEON_CLUB_ID,
      brand_name: brand.brand_name,
      parent_company: brand.parent_company,
      spirit_category: brand.spirit_category,
      volume_ml: brand.volume_ml,
      billed_amount: brand.billed_amount + (g % 7) * 10,
      pour_cost_pct: Number((17.2 + (g % 9) * 0.35).toFixed(2)),
      pour_hour: HOURS[g % HOURS.length],
      zone_name: ZONES[g % ZONES.length],
    };
  });
}

export const DEMO_TELEMETRY = buildDemoTelemetry(150);
