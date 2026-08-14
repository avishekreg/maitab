import type { UserRole } from "@/lib/types";

/**
 * Auth hierarchy helpers for enterprise floor roles.
 * FLOOR_MANAGER and CAPTAIN share floor-ops privileges (Captain = senior floor lead).
 */

export const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "CLUB_ADMIN",
  "FLOOR_MANAGER",
  "CAPTAIN",
  "GATE_STAFF",
  "BARTENDER",
  "AV_CONTROLLER",
  "CUSTOMER",
  "SAARTHI_DRIVER",
];

/** Roles that can allocate waiters/zones/bar counters */
export const FLOOR_OPS_ROLES: UserRole[] = [
  "FLOOR_MANAGER",
  "CAPTAIN",
  "CLUB_ADMIN",
  "SUPER_ADMIN",
];

/** Roles that can switch multi-venue property context */
export const VENUE_SWITCHER_ROLES: UserRole[] = [
  "CLUB_ADMIN",
  "FLOOR_MANAGER",
  "CAPTAIN",
  "SUPER_ADMIN",
];

/** Roles that can launch flash campaigns */
export const FLASH_CAMPAIGN_ROLES: UserRole[] = [
  "CLUB_ADMIN",
  "FLOOR_MANAGER",
  "CAPTAIN",
  "SUPER_ADMIN",
];

export function isFloorOpsRole(role: UserRole | null | undefined): boolean {
  return !!role && FLOOR_OPS_ROLES.includes(role);
}

export function isCaptainOrManager(role: UserRole | null | undefined): boolean {
  return role === "FLOOR_MANAGER" || role === "CAPTAIN";
}

export function canSwitchVenues(role: UserRole | null | undefined): boolean {
  return !!role && VENUE_SWITCHER_ROLES.includes(role);
}

export function canLaunchFlashCampaigns(
  role: UserRole | null | undefined
): boolean {
  return !!role && FLASH_CAMPAIGN_ROLES.includes(role);
}

export function canSpendPromoCredits(
  role: UserRole | null | undefined
): boolean {
  return role === "CLUB_ADMIN" || role === "SUPER_ADMIN" || isCaptainOrManager(role);
}
