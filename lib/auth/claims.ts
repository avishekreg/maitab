import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "CLUB_ADMIN",
  "GATE_STAFF",
  "BARTENDER",
  "AV_CONTROLLER",
  "CUSTOMER",
];

export function roleFromClaims(user: User | null | undefined): UserRole | null {
  if (!user) return null;
  const metaRole =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);
  if (metaRole && ROLES.includes(metaRole as UserRole)) {
    return metaRole as UserRole;
  }
  return null;
}

export function clubIdFromClaims(user: User | null | undefined): string | null {
  if (!user) return null;
  const clubId =
    (user.app_metadata?.club_id as string | undefined) ??
    (user.user_metadata?.club_id as string | undefined);
  return clubId ?? null;
}

export function isValidRole(value: string | null | undefined): value is UserRole {
  return !!value && ROLES.includes(value as UserRole);
}
