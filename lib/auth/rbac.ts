import type { UserRole } from "@/lib/types";

export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/admin/super": ["SUPER_ADMIN"],
  "/super-admin-vault": ["SUPER_ADMIN"],
  "/admin/super/vault": ["SUPER_ADMIN"],
  "/admin/club": ["CLUB_ADMIN", "FLOOR_MANAGER", "CAPTAIN", "SUPER_ADMIN"],
  "/partner/liquor-intelligence": [
    "SUPER_ADMIN",
    "CLUB_ADMIN",
    "FLOOR_MANAGER",
    "CAPTAIN",
  ],
  "/admin/manager": [
    "FLOOR_MANAGER",
    "CAPTAIN",
    "CLUB_ADMIN",
    "SUPER_ADMIN",
  ],
  "/gate": ["GATE_STAFF", "CLUB_ADMIN", "FLOOR_MANAGER", "CAPTAIN", "SUPER_ADMIN"],
  "/kds": [
    "BARTENDER",
    "CLUB_ADMIN",
    "FLOOR_MANAGER",
    "CAPTAIN",
    "SUPER_ADMIN",
  ],
  "/waiter": [
    "BARTENDER",
    "GATE_STAFF",
    "FLOOR_MANAGER",
    "CAPTAIN",
    "CLUB_ADMIN",
    "SUPER_ADMIN",
  ],
  "/av-panel": ["AV_CONTROLLER", "CLUB_ADMIN", "SUPER_ADMIN"],
  "/tab": ["CUSTOMER", "SUPER_ADMIN"],
  "/pass": ["CUSTOMER", "SUPER_ADMIN"],
  "/game": ["CUSTOMER", "SUPER_ADMIN"],
  "/home": ["CUSTOMER", "SUPER_ADMIN"],
  "/menu": ["CUSTOMER", "SUPER_ADMIN"],
  "/saarthi": ["SAARTHI_DRIVER", "SUPER_ADMIN"],
};

/** API routes that require JWT / demo-role claims. More specific prefixes first. */
export const PROTECTED_API_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/api/admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/api/tables/merge", roles: ["CLUB_ADMIN", "SUPER_ADMIN"] },
  {
    prefix: "/api/promos/flash",
    roles: ["CLUB_ADMIN", "FLOOR_MANAGER", "CAPTAIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/promos/campaigns",
    roles: ["CLUB_ADMIN", "FLOOR_MANAGER", "CAPTAIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/promos/credits",
    roles: ["CLUB_ADMIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/club/aggregator",
    roles: ["CLUB_ADMIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/ops/crud",
    roles: ["CLUB_ADMIN", "FLOOR_MANAGER", "CAPTAIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/ops/compliance",
    roles: [
      "CUSTOMER",
      "CLUB_ADMIN",
      "FLOOR_MANAGER",
      "CAPTAIN",
      "SUPER_ADMIN",
      "GATE_STAFF",
      "BARTENDER",
    ],
  },
  {
    prefix: "/api/staff/shifts",
    roles: [
      "FLOOR_MANAGER",
      "CAPTAIN",
      "CLUB_ADMIN",
      "SUPER_ADMIN",
      "GATE_STAFF",
    ],
  },
  { prefix: "/api/lucky-draw/run", roles: ["CLUB_ADMIN", "SUPER_ADMIN"] },
  {
    prefix: "/api/orders/ready",
    roles: [
      "BARTENDER",
      "CLUB_ADMIN",
      "FLOOR_MANAGER",
      "CAPTAIN",
      "SUPER_ADMIN",
    ],
  },
  {
    prefix: "/api/orders/handshake",
    roles: [
      "BARTENDER",
      "CLUB_ADMIN",
      "FLOOR_MANAGER",
      "CAPTAIN",
      "SUPER_ADMIN",
      "GATE_STAFF",
    ],
  },
  {
    prefix: "/api/discounts/approve",
    roles: ["BARTENDER", "CLUB_ADMIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/discounts/pending",
    roles: ["BARTENDER", "CLUB_ADMIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/api/discounts/request",
    roles: ["CUSTOMER", "SUPER_ADMIN"],
  },
  { prefix: "/api/qr/table", roles: ["CLUB_ADMIN", "SUPER_ADMIN", "GATE_STAFF"] },
  {
    prefix: "/api/sessions/attach",
    roles: ["CUSTOMER", "SUPER_ADMIN", "CLUB_ADMIN", "GATE_STAFF"],
  },
  { prefix: "/api/pass/token", roles: ["CUSTOMER", "SUPER_ADMIN"] },
  {
    prefix: "/api/pass/verify",
    roles: ["GATE_STAFF", "CLUB_ADMIN", "SUPER_ADMIN"],
  },
  { prefix: "/api/payments/settle", roles: ["CUSTOMER", "SUPER_ADMIN"] },
];

/** Public API prefixes (auth / inbound webhooks / SaaS onboard / Android APK). */
export const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/payments/webhooks/",
  "/api/onboard",
  "/api/android-download",
  "/api/download/apk",
  "/api/download/",
  "/api/saarthi",
];

export type ApiGuardResult =
  | { ok: true; role: UserRole | null }
  | { ok: false; status: 401 | 403; reason: string };

export function roleAllowed(pathname: string, role: UserRole | null): boolean {
  const match = Object.entries(PROTECTED_ROUTES).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!match) return true;
  if (!role) return false;
  return match[1].includes(role);
}

export function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function apiRoleAllowed(
  pathname: string,
  role: UserRole | null
): ApiGuardResult {
  if (!pathname.startsWith("/api")) {
    return { ok: true, role };
  }

  if (isPublicApi(pathname)) {
    return { ok: true, role };
  }

  const match = PROTECTED_API_ROUTES.find(
    (entry) =>
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );

  // Unknown API routes default to authenticated staff/customer deny-closed.
  if (!match) {
    if (!role) {
      return { ok: false, status: 401, reason: "Authentication required" };
    }
    return { ok: true, role };
  }

  if (!role) {
    return { ok: false, status: 401, reason: "Authentication required" };
  }

  if (!match.roles.includes(role)) {
    return {
      ok: false,
      status: 403,
      reason: `Role ${role} cannot access ${pathname}`,
    };
  }

  return { ok: true, role };
}

export function canViewFinancials(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "CLUB_ADMIN";
}

export function canScanPasses(role: UserRole): boolean {
  return (
    role === "GATE_STAFF" ||
    role === "CLUB_ADMIN" ||
    role === "FLOOR_MANAGER" ||
    role === "CAPTAIN" ||
    role === "SUPER_ADMIN"
  );
}

export function canManageMenu(role: UserRole): boolean {
  return role === "CLUB_ADMIN" || role === "SUPER_ADMIN";
}
