import type { User } from "@supabase/supabase-js";
import { PUBLIC_DEMO_USERS } from "@/lib/auth/demo-users";
import type { UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";

/** Comma-separated master emails authorized as Super Admin. */
export function superAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = superAdminEmails();
  if (!list.length) return false;
  return list.includes(email.trim().toLowerCase());
}

export function googleProfileFromUser(user: User): {
  email: string;
  fullName: string;
  avatarUrl: string | null;
} {
  const email = (user.email || "").trim().toLowerCase();
  const meta = user.user_metadata ?? {};
  const fullName =
    String(meta.full_name || meta.name || meta.fullName || "").trim() ||
    email.split("@")[0] ||
    "Google User";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  return { email, fullName, avatarUrl };
}

/**
 * Resolve destination role after Google identity is verified.
 * Super Admin emails always win over any prior staff role.
 */
export function resolveGoogleAuthRole(
  email: string,
  existingRole: UserRole | null
): UserRole {
  if (isSuperAdminEmail(email)) return "SUPER_ADMIN";

  const demo = PUBLIC_DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (demo) return demo.role;

  if (
    existingRole &&
    existingRole !== "SUPER_ADMIN" &&
    existingRole !== "CUSTOMER"
  ) {
    return existingRole;
  }

  if (existingRole === "CUSTOMER") return "CUSTOMER";
  return "CUSTOMER";
}

export function homeForGoogleRole(role: UserRole, isNewUser: boolean): string {
  if (role === "SUPER_ADMIN") return ROLE_HOME.SUPER_ADMIN;
  if (role === "CLUB_ADMIN") return ROLE_HOME.CLUB_ADMIN;
  if (role === "FLOOR_MANAGER" || role === "CAPTAIN") {
    return ROLE_HOME.FLOOR_MANAGER;
  }
  if (role === "GATE_STAFF") return ROLE_HOME.GATE_STAFF;
  if (role === "BARTENDER") return ROLE_HOME.BARTENDER;
  if (role === "AV_CONTROLLER") return ROLE_HOME.AV_CONTROLLER;
  // Never default OAuth strangers to demo guest /home (Rahul).
  if (isNewUser) return "/onboard";
  return ROLE_HOME.CUSTOMER;
}

export function oauthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

/** Placeholder unique phone for Google-provisioned profiles (schema requires phone). */
export function oauthPhonePlaceholder(userId: string): string {
  const compact = userId.replace(/-/g, "").slice(0, 14);
  return `gauth:${compact}`;
}
