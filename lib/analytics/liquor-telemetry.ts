import {
  COMPETITOR_CLUB_ID,
  NEON_CLUB_ID,
  NEON_SKY_CLUB_ID,
} from "@/lib/supabase/env";

export type SpiritFamily =
  | "Whisky"
  | "Tequila & Mezcal"
  | "Vodka"
  | "Gin"
  | "Rum"
  | "Beer & Cider"
  | "Wine & Champagne";

export type SpiritSubcategory =
  | "Single Malt Scotch"
  | "Blended Scotch"
  | "Bourbon"
  | "Irish Whiskey"
  | "Indian Craft Single Malt"
  | "Blanco"
  | "Reposado"
  | "Añejo"
  | "Artisanal Mezcal"
  | "Premium Wheat"
  | "Potato"
  | "Flavored Craft"
  | "London Dry"
  | "Botanical Craft"
  | "Contemporary Pink"
  | "Dark Aged"
  | "Spiced"
  | "White/Agricole"
  | "Draught/Craft Taps"
  | "Premium Imported Lager"
  | "Stout"
  | "Hard Seltzer"
  | "Brut Champagne"
  | "Prosecco"
  | "Still Red/White";

export type ParentCompany =
  | "Diageo"
  | "Pernod Ricard"
  | "Bacardi"
  | "AB InBev"
  | "Beam Suntory";

export type NetworkVenueKey = "all" | "neon" | "mirage" | "toyroom";
export type BrandPartnerKey = "macro" | "Diageo" | "Pernod Ricard" | "Bacardi";
export type TimeframeKey = "tonight" | "7d" | "mtd";

export interface ConsumptionTelemetry {
  id: string;
  venue_id: string;
  venue_key: Exclude<NetworkVenueKey, "all">;
  brand_name: string;
  sku: string;
  parent_company: ParentCompany;
  spirit_category: SpiritFamily;
  spirit_subcategory: SpiritSubcategory;
  volume_ml: number;
  billed_amount: number;
  pour_cost_pct: number;
  pour_hour: number;
  zone_name: "VIP Lounge" | "Main Floor" | "Rooftop Bar";
}

export const NETWORK_VENUES: { key: NetworkVenueKey; label: string; id?: string }[] = [
  { key: "all", label: "All 42 Partner Clubs" },
  { key: "neon", label: "Neon District", id: NEON_CLUB_ID },
  { key: "mirage", label: "Mirage Rooftop", id: NEON_SKY_CLUB_ID },
  { key: "toyroom", label: "Toy Room", id: COMPETITOR_CLUB_ID },
];

export const BRAND_PARTNER_SCOPES: { key: BrandPartnerKey; label: string }[] = [
  { key: "macro", label: "Macro Enterprise View" },
  { key: "Diageo", label: "Diageo Partner Deck" },
  { key: "Pernod Ricard", label: "Pernod Ricard Deck" },
  { key: "Bacardi", label: "Bacardi Deck" },
];

export const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
  { key: "tonight", label: "Tonight (Live)" },
  { key: "7d", label: "Last 7 Days" },
  { key: "mtd", label: "Month-to-Date" },
];

const CATALOG: {
  sku: string;
  brand_name: string;
  parent_company: ParentCompany;
  spirit_category: SpiritFamily;
  spirit_subcategory: SpiritSubcategory;
  volume_ml: number;
  billed_amount: number;
}[] = [
  { sku: "Talisker 10YO", brand_name: "Talisker", parent_company: "Diageo", spirit_category: "Whisky", spirit_subcategory: "Single Malt Scotch", volume_ml: 30, billed_amount: 890 },
  { sku: "Johnnie Walker Black", brand_name: "Johnnie Walker", parent_company: "Diageo", spirit_category: "Whisky", spirit_subcategory: "Blended Scotch", volume_ml: 30, billed_amount: 450 },
  { sku: "Maker's Mark", brand_name: "Maker's Mark", parent_company: "Beam Suntory", spirit_category: "Whisky", spirit_subcategory: "Bourbon", volume_ml: 30, billed_amount: 620 },
  { sku: "Jameson", brand_name: "Jameson", parent_company: "Pernod Ricard", spirit_category: "Whisky", spirit_subcategory: "Irish Whiskey", volume_ml: 30, billed_amount: 480 },
  { sku: "Amrut Fusion", brand_name: "Amrut", parent_company: "Diageo", spirit_category: "Whisky", spirit_subcategory: "Indian Craft Single Malt", volume_ml: 30, billed_amount: 1100 },
  { sku: "Don Julio Blanco", brand_name: "Don Julio", parent_company: "Diageo", spirit_category: "Tequila & Mezcal", spirit_subcategory: "Blanco", volume_ml: 30, billed_amount: 680 },
  { sku: "Don Julio 1942", brand_name: "Don Julio", parent_company: "Diageo", spirit_category: "Tequila & Mezcal", spirit_subcategory: "Añejo", volume_ml: 30, billed_amount: 1850 },
  { sku: "Patrón Reposado", brand_name: "Patrón", parent_company: "Bacardi", spirit_category: "Tequila & Mezcal", spirit_subcategory: "Reposado", volume_ml: 30, billed_amount: 920 },
  { sku: "Del Maguey Vida", brand_name: "Del Maguey", parent_company: "Pernod Ricard", spirit_category: "Tequila & Mezcal", spirit_subcategory: "Artisanal Mezcal", volume_ml: 30, billed_amount: 980 },
  { sku: "Grey Goose", brand_name: "Grey Goose", parent_company: "Pernod Ricard", spirit_category: "Vodka", spirit_subcategory: "Premium Wheat", volume_ml: 30, billed_amount: 520 },
  { sku: "Absolut Elyx", brand_name: "Absolut", parent_company: "Pernod Ricard", spirit_category: "Vodka", spirit_subcategory: "Potato", volume_ml: 30, billed_amount: 560 },
  { sku: "Cîroc Pineapple", brand_name: "Cîroc", parent_company: "Diageo", spirit_category: "Vodka", spirit_subcategory: "Flavored Craft", volume_ml: 30, billed_amount: 640 },
  { sku: "Bombay Sapphire", brand_name: "Bombay Sapphire", parent_company: "Bacardi", spirit_category: "Gin", spirit_subcategory: "London Dry", volume_ml: 30, billed_amount: 480 },
  { sku: "Tanqueray No. Ten", brand_name: "Tanqueray", parent_company: "Diageo", spirit_category: "Gin", spirit_subcategory: "Botanical Craft", volume_ml: 30, billed_amount: 540 },
  { sku: "Gordon's Pink", brand_name: "Gordon's", parent_company: "Diageo", spirit_category: "Gin", spirit_subcategory: "Contemporary Pink", volume_ml: 30, billed_amount: 390 },
  { sku: "Havana Club 7YO", brand_name: "Havana Club", parent_company: "Pernod Ricard", spirit_category: "Rum", spirit_subcategory: "Dark Aged", volume_ml: 30, billed_amount: 510 },
  { sku: "Captain Morgan", brand_name: "Captain Morgan", parent_company: "Diageo", spirit_category: "Rum", spirit_subcategory: "Spiced", volume_ml: 30, billed_amount: 360 },
  { sku: "Bacardi Carta Blanca", brand_name: "Bacardi", parent_company: "Bacardi", spirit_category: "Rum", spirit_subcategory: "White/Agricole", volume_ml: 30, billed_amount: 340 },
  { sku: "Hoegaarden Draught", brand_name: "Hoegaarden", parent_company: "AB InBev", spirit_category: "Beer & Cider", spirit_subcategory: "Draught/Craft Taps", volume_ml: 330, billed_amount: 380 },
  { sku: "Kingfisher Ultra", brand_name: "Kingfisher Ultra", parent_company: "AB InBev", spirit_category: "Beer & Cider", spirit_subcategory: "Premium Imported Lager", volume_ml: 330, billed_amount: 320 },
  { sku: "Guinness Draught", brand_name: "Guinness", parent_company: "Diageo", spirit_category: "Beer & Cider", spirit_subcategory: "Stout", volume_ml: 440, billed_amount: 420 },
  { sku: "Bud Light Seltzer", brand_name: "Bud Light", parent_company: "AB InBev", spirit_category: "Beer & Cider", spirit_subcategory: "Hard Seltzer", volume_ml: 330, billed_amount: 290 },
  { sku: "Mumm Cordon Rouge", brand_name: "G.H. Mumm", parent_company: "Pernod Ricard", spirit_category: "Wine & Champagne", spirit_subcategory: "Brut Champagne", volume_ml: 150, billed_amount: 1400 },
  { sku: "Martini Prosecco", brand_name: "Martini", parent_company: "Bacardi", spirit_category: "Wine & Champagne", spirit_subcategory: "Prosecco", volume_ml: 150, billed_amount: 720 },
  { sku: "Jacob's Creek Shiraz", brand_name: "Jacob's Creek", parent_company: "Pernod Ricard", spirit_category: "Wine & Champagne", spirit_subcategory: "Still Red/White", volume_ml: 150, billed_amount: 480 },
];

const VENUE_CYCLE: Exclude<NetworkVenueKey, "all">[] = ["neon", "mirage", "toyroom"];
const VENUE_IDS: Record<Exclude<NetworkVenueKey, "all">, string> = {
  neon: NEON_CLUB_ID,
  mirage: NEON_SKY_CLUB_ID,
  toyroom: COMPETITOR_CLUB_ID,
};
const ZONES = ["VIP Lounge", "Main Floor", "Rooftop Bar"] as const;

function weightedHour(i: number): number {
  const weights = [20, 20, 21, 22, 22, 23, 23, 0, 0, 1, 1, 1, 1, 2, 2, 3, 4];
  return weights[i % weights.length];
}

export function buildDemoTelemetry(count = 420): ConsumptionTelemetry[] {
  return Array.from({ length: count }, (_, i) => {
    const g = i + 1;
    const sku = CATALOG[g % CATALOG.length];
    const venue_key = VENUE_CYCLE[g % VENUE_CYCLE.length];
    return {
      id: `tel-${String(g).padStart(3, "0")}`,
      venue_id: VENUE_IDS[venue_key],
      venue_key,
      brand_name: sku.brand_name,
      sku: sku.sku,
      parent_company: sku.parent_company,
      spirit_category: sku.spirit_category,
      spirit_subcategory: sku.spirit_subcategory,
      volume_ml: sku.volume_ml,
      billed_amount: sku.billed_amount + (g % 7) * 12,
      pour_cost_pct: Number((16.4 + (g % 11) * 0.28).toFixed(2)),
      pour_hour: weightedHour(g),
      zone_name: ZONES[g % ZONES.length],
    };
  });
}

export const DEMO_TELEMETRY = buildDemoTelemetry(420);

export function timeframeMultiplier(tf: TimeframeKey): number {
  if (tf === "7d") return 6.4;
  if (tf === "mtd") return 22;
  return 1;
}

export function filterTelemetry(
  rows: ConsumptionTelemetry[],
  venue: NetworkVenueKey,
  partner: BrandPartnerKey
): ConsumptionTelemetry[] {
  return rows.filter((r) => {
    if (venue !== "all" && r.venue_key !== venue) return false;
    if (partner !== "macro" && r.parent_company !== partner) return false;
    return true;
  });
}

export const SHARE_TABS = [
  "All Spirits",
  "Single Malts",
  "Tequila/Agave",
  "Craft Gin",
  "Draught Beers",
] as const;

export type ShareTab = (typeof SHARE_TABS)[number];

export function matchesShareTab(row: ConsumptionTelemetry, tab: ShareTab): boolean {
  if (tab === "All Spirits") return true;
  if (tab === "Single Malts") {
    return (
      row.spirit_subcategory === "Single Malt Scotch" ||
      row.spirit_subcategory === "Indian Craft Single Malt"
    );
  }
  if (tab === "Tequila/Agave") return row.spirit_category === "Tequila & Mezcal";
  if (tab === "Craft Gin") return row.spirit_category === "Gin";
  return (
    row.spirit_subcategory === "Draught/Craft Taps" ||
    row.spirit_subcategory === "Stout"
  );
}

export const TOP_SKU_BY_COMPANY: Record<string, string> = {
  Diageo: "Don Julio 1942",
  "Pernod Ricard": "Grey Goose",
  Bacardi: "Patrón Reposado",
  "AB InBev": "Kingfisher Ultra",
  "Beam Suntory": "Maker's Mark",
};

export const INVENTORY_ROWS = [
  { name: "Don Julio 1942", fast: 48, dead: 1, variance: 9 },
  { name: "Talisker 10YO", fast: 41, dead: 2, variance: 7 },
  { name: "Grey Goose", fast: 33, dead: 6, variance: 4 },
  { name: "Bombay Sapphire", fast: 19, dead: 16, variance: 5 },
  { name: "Kingfisher Ultra", fast: 52, dead: 0, variance: 3 },
  { name: "Amrut Fusion", fast: 11, dead: 22, variance: 2 },
];

/** Synthetic nightlife pour curve (30ml standard units). Peak 1:30 AM is ~4.5x 8 PM tequila. */
export const HOURLY_VELOCITY = [
  { hour: "8:00 PM", beer: 46, cocktails: 32, tequila: 10, malts: 8, hydration: 6 },
  { hour: "10:00 PM", beer: 44, cocktails: 38, tequila: 22, malts: 16, hydration: 10 },
  { hour: "12:00 AM", beer: 24, cocktails: 28, tequila: 41, malts: 34, hydration: 14 },
  { hour: "1:30 AM", beer: 16, cocktails: 18, tequila: 45, malts: 36, hydration: 18 },
  { hour: "3:00 AM", beer: 8, cocktails: 10, tequila: 14, malts: 11, hydration: 36 },
  { hour: "4:00 AM", beer: 5, cocktails: 6, tequila: 7, malts: 5, hydration: 28 },
];
