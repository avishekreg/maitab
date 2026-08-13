import type { OrderItem } from "@/lib/types";

export const PENALTIES = {
  tequila: { name: "Tequila Shot", quantity: 1, unit_price: 280, category: "SHOT" },
  tequila2: { name: "Tequila Shot", quantity: 2, unit_price: 280, category: "SHOT" },
  vodka: { name: "Vodka Shot", quantity: 1, unit_price: 260, category: "SHOT" },
  jager: { name: "Jägerbomb", quantity: 1, unit_price: 450, category: "SHOT" },
  heineken: { name: "Heineken", quantity: 1, unit_price: 350, category: "BEER" },
  corona: { name: "Corona", quantity: 1, unit_price: 380, category: "BEER" },
  gnt: { name: "Gin & Tonic", quantity: 1, unit_price: 520, category: "COCKTAIL" },
  espresso: {
    name: "Espresso Martini",
    quantity: 1,
    unit_price: 650,
    category: "COCKTAIL",
  },
  round: {
    name: "Table Round (Heineken)",
    quantity: 4,
    unit_price: 350,
    category: "BEER",
  },
} as const satisfies Record<string, OrderItem>;

export type PenaltyKey = keyof typeof PENALTIES;
