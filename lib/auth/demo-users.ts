import type { UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";

/** Shared password for public demo venue roles only (never Super Admin). */
export const DEMO_PASSWORD = "MaiTabDemo!234";

/** Short floor PINs accepted alongside DEMO_PASSWORD. */
export const ROLE_DEMO_PINS: Partial<Record<UserRole, string>> = {
  FLOOR_MANAGER: "1111",
  CAPTAIN: "1111",
  BARTENDER: "2222",
  GATE_STAFF: "3333",
  SAARTHI_DRIVER: "4444",
  CLUB_ADMIN: "0000",
};

/** Alternate emails that map onto PUBLIC_DEMO_USERS. */
export const DEMO_EMAIL_ALIASES: Record<string, string> = {
  "owner@neon.demo": "club@maitab.demo",
  "manager@neon.demo": "manager@maitab.demo",
  "bar@neon.demo": "bar@maitab.demo",
  "gate@neon.demo": "gate@maitab.demo",
  "driver@neon.demo": "arjun.saarthi@maitab.demo",
};

export interface DemoUserAccount {
  role: UserRole;
  email: string;
  password: string;
  name: string;
  home: string;
  description: string;
}

/**
 * Public demo roster — never includes SUPER_ADMIN.
 * Keep emails in sync with `supabase/seed.sql` for JWT mode.
 */
export const PUBLIC_DEMO_USERS: DemoUserAccount[] = [
  {
    role: "CUSTOMER",
    email: "rahul@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Rahul Deshmukh",
    home: ROLE_HOME.CUSTOMER,
    description: "Tab · Pass · Games · Gold tier",
  },
  {
    role: "BARTENDER",
    email: "bar@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Lead Bartender",
    home: ROLE_HOME.BARTENDER,
    description: "KDS queue · Mark Ready · deal verify",
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
    role: "AV_CONTROLLER",
    email: "av@maitab.demo",
    password: DEMO_PASSWORD,
    name: "AV Controller",
    home: ROLE_HOME.AV_CONTROLLER,
    description: "LED wall · ticker · hero takeovers",
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
    role: "FLOOR_MANAGER",
    email: "manager@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Floor Manager Maya",
    home: ROLE_HOME.FLOOR_MANAGER,
    description: "Zone allocation · bar counters · shifts",
  },
  {
    role: "CAPTAIN",
    email: "captain@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Floor Captain Vikram",
    home: ROLE_HOME.CAPTAIN,
    description: "Senior floor lead · shift override",
  },
  {
    role: "SAARTHI_DRIVER",
    email: "arjun.saarthi@maitab.demo",
    password: DEMO_PASSWORD,
    name: "Arjun Khanna",
    home: ROLE_HOME.SAARTHI_DRIVER,
    description: "mAI Saarthi chauffeur companion · verified DL + PCC",
  },
];

/** @deprecated Use PUBLIC_DEMO_USERS — kept as alias for public roster only */
export const DEMO_USERS = PUBLIC_DEMO_USERS;

/**
 * Super Admin is never listed in public UI.
 * Access only via `/admin/super-portal` + SUPER_ADMIN_PORTAL_KEY.
 */
export const SUPER_ADMIN_INTERNAL: DemoUserAccount = {
  role: "SUPER_ADMIN",
  email: process.env.SUPER_ADMIN_DEMO_EMAIL || "",
  password: process.env.SUPER_ADMIN_DEMO_PASSWORD || "",
  name: "Platform Owner",
  home: ROLE_HOME.SUPER_ADMIN,
  description: "Internal only",
};

export const DEMO_EMAILS: Partial<Record<UserRole, string>> = Object.fromEntries(
  PUBLIC_DEMO_USERS.map((u) => [u.role, u.email])
);

export function demoUserForRole(role: UserRole): DemoUserAccount {
  if (role === "SUPER_ADMIN") return SUPER_ADMIN_INTERNAL;
  return (
    PUBLIC_DEMO_USERS.find((u) => u.role === role) ?? PUBLIC_DEMO_USERS[0]!
  );
}

export function isPublicDemoRole(role: UserRole): boolean {
  return PUBLIC_DEMO_USERS.some((u) => u.role === role);
}

export function resolveDemoEmail(email: string): string {
  const key = email.trim().toLowerCase();
  return DEMO_EMAIL_ALIASES[key] ?? key;
}

export function pinMatchesRole(pin: string, role: UserRole): boolean {
  if (pin === DEMO_PASSWORD) return true;
  if (process.env.STAFF_ACCESS_PIN && pin === process.env.STAFF_ACCESS_PIN) {
    return true;
  }
  return ROLE_DEMO_PINS[role] === pin;
}

export function portalKeyConfigured(): boolean {
  const key = process.env.SUPER_ADMIN_PORTAL_KEY;
  return Boolean(key && key.length >= 16 && !key.includes("replace"));
}

export function portalKeyMatches(provided: string | null | undefined): boolean {
  if (!portalKeyConfigured() || !provided) return false;
  return provided === process.env.SUPER_ADMIN_PORTAL_KEY;
}
