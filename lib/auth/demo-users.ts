import type { UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";

/** Shared password for every seeded demo account. */
export const DEMO_PASSWORD = "MaiTabDemo!234";

export interface DemoUserAccount {
  role: UserRole;
  email: string;
  password: string;
  name: string;
  home: string;
  description: string;
}

/**
 * Canonical demo roster — keep in sync with `supabase/seed.sql`.
 * Works in cookie-only mode without Supabase; JWT mode after seed.
 */
export const DEMO_USERS: DemoUserAccount[] = [
  {
    role: "SUPER_ADMIN",
    email: "super@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Platform Owner",
    home: ROLE_HOME.SUPER_ADMIN,
    description: "Command Center · GMV · fraud · integrations",
  },
  {
    role: "CLUB_ADMIN",
    email: "club@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Neon Club Admin",
    home: ROLE_HOME.CLUB_ADMIN,
    description: "Venue ops · menu · merges · promos",
  },
  {
    role: "GATE_STAFF",
    email: "gate@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Gate Hostess",
    home: ROLE_HOME.GATE_STAFF,
    description: "Member Pass scanner · micro-hold",
  },
  {
    role: "BARTENDER",
    email: "bar@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Lead Bartender",
    home: ROLE_HOME.BARTENDER,
    description: "KDS queue · Mark Ready",
  },
  {
    role: "AV_CONTROLLER",
    email: "av@maitab.demo",
    password: DEMO_PASSWORD,
    name: "AV Controller",
    home: ROLE_HOME.AV_CONTROLLER,
    description: "LED wall · ticker · hero takeovers",
  },
  {
    role: "CUSTOMER",
    email: "rahul@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Rahul Deshmukh",
    home: ROLE_HOME.CUSTOMER,
    description: "Tab · Pass · Games · Gold tier",
  },
];

export const DEMO_EMAILS: Record<UserRole, string> = Object.fromEntries(
  DEMO_USERS.map((u) => [u.role, u.email])
) as Record<UserRole, string>;

export function demoUserForRole(role: UserRole): DemoUserAccount {
  return DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[5]!;
}
