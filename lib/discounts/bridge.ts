import type { ActiveSession, ExternalProvider } from "@/lib/types";

export const EXTERNAL_PROVIDERS: {
  id: Exclude<ExternalProvider, "NONE">;
  label: string;
  defaultPercent: number;
}[] = [
  { id: "ZOMATO_DISTRICT", label: "Zomato District", defaultPercent: 20 },
  { id: "SWIGGY_DINEOUT", label: "Swiggy Dineout", defaultPercent: 20 },
  { id: "EAZYDINER", label: "EazyDiner", defaultPercent: 15 },
  { id: "DIRECT", label: "Partner / Direct deal", defaultPercent: 10 },
];

export function providerLabel(provider: ExternalProvider | null | undefined): string {
  if (!provider || provider === "NONE") return "External";
  return (
    EXTERNAL_PROVIDERS.find((p) => p.id === provider)?.label ?? provider
  );
}

export function defaultDiscountFor(
  provider: ExternalProvider
): number {
  return (
    EXTERNAL_PROVIDERS.find((p) => p.id === provider)?.defaultPercent ?? 10
  );
}

export function sessionHasApprovedExternalDeal(
  session: Pick<
    ActiveSession,
    "discount_status" | "external_provider" | "is_native_promos_eligible"
  >
): boolean {
  return (
    session.discount_status === "APPROVED" &&
    session.external_provider !== "NONE"
  );
}

export function sessionCanUseNativePromos(
  session: Pick<
    ActiveSession,
    "is_native_promos_eligible" | "discount_status"
  >
): boolean {
  if (!session.is_native_promos_eligible) return false;
  if (session.discount_status === "APPROVED") return false;
  return true;
}

/** Discounted unit price when an external deal is APPROVED. */
export function discountedUnitPrice(
  mrp: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0) return mrp;
  return Math.round(mrp * (1 - discountPercentage / 100));
}

export function exclusivityNote(provider: ExternalProvider): string {
  const name = providerLabel(provider);
  return `${name} deals cannot be combined with mAITab Native 1:1 Flash Promos or Hourly 25% Lucky Draws.`;
}
