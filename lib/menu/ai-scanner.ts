export interface ParsedMenuItem {
  id: string;
  item_name: string;
  category: string;
  subtype: string;
  price: number;
  volume_spec: string;
  description: string;
}

const CATALOG: Omit<ParsedMenuItem, "id">[] = [
  {
    item_name: "Macallan 12 Double Cask",
    category: "Single Malt Whisky",
    subtype: "Speyside Scotch",
    price: 1150,
    volume_spec: "30ml / 60ml / Bottle",
    description: "Sherry-oak and American oak double cask. Honey, citrus, ginger.",
  },
  {
    item_name: "Talisker 10YO",
    category: "Single Malt Whisky",
    subtype: "Islay / Islands",
    price: 890,
    volume_spec: "30ml / 60ml / Bottle",
    description: "Maritime peat, pepper, and sea spray.",
  },
  {
    item_name: "Don Julio 1942",
    category: "Tequila",
    subtype: "Añejo",
    price: 1850,
    volume_spec: "30ml / 60ml / Bottle",
    description: "Cooked agave, caramel, and vanilla. VIP pour.",
  },
  {
    item_name: "Avocado Truffle Roll",
    category: "Appetizers",
    subtype: "Japanese Sushi",
    price: 720,
    volume_spec: "6 pc",
    description: "Avocado, truffle oil, toasted sesame, soy glaze.",
  },
  {
    item_name: "Espresso Martini",
    category: "Cocktails",
    subtype: "Contemporary Classic",
    price: 650,
    volume_spec: "Glass",
    description: "Vodka, coffee liqueur, fresh espresso, vanilla foam.",
  },
  {
    item_name: "Kingfisher Ultra Draught",
    category: "Beer",
    subtype: "Premium Lager",
    price: 380,
    volume_spec: "Pint / Tower",
    description: "Crisp imported-style lager on tap.",
  },
];

export function extractFromFilename(fileName: string): ParsedMenuItem[] {
  const lower = fileName.toLowerCase();
  let slice = CATALOG;
  if (lower.includes("whisky") || lower.includes("malt") || lower.includes("bar")) {
    slice = CATALOG.filter((i) => i.category.includes("Whisky") || i.category === "Tequila" || i.category === "Cocktails" || i.category === "Beer");
  } else if (lower.includes("food") || lower.includes("kitchen") || lower.includes("sushi")) {
    slice = CATALOG.filter((i) => i.category === "Appetizers" || i.category === "Cocktails");
  }
  return slice.map((item, i) => ({
    ...item,
    id: `scan-${fileName.slice(0, 8)}-${i}`,
  }));
}

export function mergeScans(batches: ParsedMenuItem[][]): ParsedMenuItem[] {
  const seen = new Set<string>();
  const out: ParsedMenuItem[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      const key = item.item_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function parseVisionJson(raw: unknown): ParsedMenuItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, i) => {
    const r = row as Record<string, unknown>;
    return {
      id: `ai-${i}-${String(r.item_name || "item").slice(0, 12)}`,
      item_name: String(r.item_name || "Untitled"),
      category: String(r.category || "Other"),
      subtype: String(r.subtype || ""),
      price: Number(r.price ?? 0),
      volume_spec: String(r.volume_spec || "30ml"),
      description: String(r.description || ""),
    };
  });
}
