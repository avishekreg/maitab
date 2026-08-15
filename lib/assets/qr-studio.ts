export type CollateralTemplate =
  | "tent"
  | "gate"
  | "bar"
  | "valet";

export const ZONES = [
  "VIP Lounge",
  "PDR 1",
  "Main Floor",
  "Rooftop Deck",
  "Bar Counter",
] as const;

export const TEMPLATES: { id: CollateralTemplate; label: string }[] = [
  { id: "tent", label: "Table Acrylic Tent Card (4x6 inch)" },
  { id: "gate", label: "Gate Fast-Pass Entrance Poster (A4 / Standee)" },
  { id: "bar", label: "Bar Counter Quick-Pour Standee" },
  { id: "valet", label: "Valet Desk mAI Saarthi Chauffeur QR Card" },
];

export interface TableAsset {
  id: string;
  section: string;
  identifier: string;
  url: string;
}

export function padIndex(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

export function buildBatch(
  prefix: string,
  start: number,
  count: number,
  section: string,
  venueSlug: string
): TableAsset[] {
  const clean = prefix.replace(/-+$/, "");
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const identifier = `${clean}-${padIndex(start + i)}`;
    return {
      id: `${section}-${identifier}`,
      section,
      identifier,
      url: qrUrl(venueSlug, identifier),
    };
  });
}

export function qrUrl(venueSlug: string, tableId: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://mai-tab.vercel.app";
  if (tableId.toLowerCase().includes("saarthi") || tableId === "VALET") {
    return `${origin}/home?saarthi=1&v=${encodeURIComponent(venueSlug)}`;
  }
  if (tableId === "GATE") {
    return `${origin}/pass?v=${encodeURIComponent(venueSlug)}`;
  }
  return `${origin}/tab?v=${encodeURIComponent(venueSlug)}&t=${encodeURIComponent(tableId)}`;
}

export function pdfPage(template: CollateralTemplate): {
  format: [number, number] | "a4";
  orient: "p" | "l";
} {
  if (template === "tent") return { format: [4, 6], orient: "p" };
  if (template === "valet") return { format: [5, 3.5], orient: "l" };
  if (template === "bar") return { format: [4, 8], orient: "p" };
  return { format: "a4", orient: "p" };
}
