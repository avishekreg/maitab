import { NextResponse, type NextRequest } from "next/server";
import { apiRoleAllowed, roleAllowed } from "@/lib/auth/rbac";
import { isValidRole } from "@/lib/auth/claims";
import { isSuperAdminEmail, superAdminEmails } from "@/lib/auth/google";
import type { UserRole } from "@/lib/types";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  applyAuthCookies,
  clearAuthCookies,
  DEMO_ROLE_COOKIE,
  DEVICE_BIND_COOKIE,
  hasForbiddenPageQuery,
  hashUserAgent,
  verifyDeviceBind,
} from "@/lib/security/session-cookies";

const GUEST_APP_PREFIXES = ["/home", "/tab", "/pass", "/game", "/games", "/menu"] as const;

function isGuestAppPath(pathname: string): boolean {
  return GUEST_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isSuperAdminSurface(pathname: string): boolean {
  return (
    pathname === "/admin/super" ||
    pathname.startsWith("/admin/super/") ||
    pathname === "/super-admin-vault" ||
    pathname.startsWith("/super-admin-vault/")
  );
}

function readDemoRole(request: NextRequest): UserRole | null {
  const value = request.cookies.get(DEMO_ROLE_COOKIE)?.value;
  return isValidRole(value) ? value : null;
}

function resolveRole(
  jwtRole: UserRole | null,
  request: NextRequest,
  pathname: string
): UserRole | null {
  const demo = readDemoRole(request);
  // Real OAuth / JWT sessions always win over leftover demo guest cookies.
  // (Previously CUSTOMER demo cookie forced /home → demo Rahul after Google login.)
  if (jwtRole) return jwtRole;

  if (
    demo === "CUSTOMER" &&
    GUEST_APP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return "CUSTOMER";
  }
  if (demo) return demo;
  if (!isSupabaseConfigured()) return "CUSTOMER";
  return null;
}

async function deviceBindOk(request: NextRequest): Promise<boolean> {
  const bind = await verifyDeviceBind(
    request.cookies.get(DEVICE_BIND_COOKIE)?.value
  );
  if (!bind) return false;
  const uaHash = await hashUserAgent(request.headers.get("user-agent"));
  return bind.uaHash === uaHash;
}

function forbidSuperAdmin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("denied", "403");
  url.searchParams.set("error", "super_admin_forbidden");
  return NextResponse.redirect(url);
}

function isNativeAndroidWrapper(request: NextRequest) {
  const requestedWith = (request.headers.get("x-requested-with") ?? "").toLowerCase();
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  return (
    requestedWith === "in.syncrasystems.maitab" ||
    ua.includes("in.syncrasystems.maitab") ||
    ua.includes("capacitor")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" && isNativeAndroidWrapper(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const {
    response,
    role: jwtRole,
    email: jwtEmail,
  } = await updateSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/t/") ||
    pathname === "/login" ||
    pathname === "/admin/super-portal" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/") ||
    pathname === "/onboard" ||
    pathname.startsWith("/onboard/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/downloads/") ||
    pathname.startsWith("/badges/") ||
    pathname === "/api/android-download" ||
    pathname === "/api/download/apk" ||
    pathname.startsWith("/api/download/") ||
    pathname.startsWith("/api/saarthi")
  ) {
    return response;
  }

  if (pathname === "/super-admin-vault") {
    if (superAdminEmails().length > 0 && !isSuperAdminEmail(jwtEmail)) {
      return forbidSuperAdmin(request);
    }
    return response;
  }

  if (!pathname.startsWith("/api")) {
    const bad = hasForbiddenPageQuery(request.nextUrl.searchParams);
    if (bad) {
      return NextResponse.json(
        {
          ok: false,
          error: "403 Forbidden — raw resource IDs are not allowed in URLs",
          flag: "URL_PARAM_TAMPER",
          param: bad,
        },
        { status: 403 }
      );
    }
  }

  let role = resolveRole(jwtRole, request, pathname);
  let bootstrappedGuest = false;

  if (
    role &&
    !jwtRole &&
    request.cookies.get(DEVICE_BIND_COOKIE)?.value &&
    !(await deviceBindOk(request))
  ) {
    const killed = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(killed);
    killed.headers.set("x-maitab-security", "DEVICE_BIND_MISMATCH");
    return killed;
  }

  if (!role && isGuestAppPath(pathname)) {
    role = "CUSTOMER";
    bootstrappedGuest = true;
  }

  if (isGuestAppPath(pathname) && !roleAllowed(pathname, role)) {
    role = "CUSTOMER";
    bootstrappedGuest = true;
  }

  // Sovereign Super Admin identity lock
  if (isSuperAdminSurface(pathname) && superAdminEmails().length > 0) {
    const demoEmail = (process.env.SUPER_ADMIN_DEMO_EMAIL || "")
      .trim()
      .toLowerCase();
    const emailOk =
      isSuperAdminEmail(jwtEmail) ||
      (role === "SUPER_ADMIN" &&
        Boolean(demoEmail) &&
        isSuperAdminEmail(demoEmail) &&
        !jwtEmail);
    if (!emailOk) {
      return forbidSuperAdmin(request);
    }
  }

  if (pathname.startsWith("/api")) {
    const guestCustomerApis = [
      "/api/pass/token",
      "/api/payments/settle",
      "/api/discounts/request",
      "/api/orders/handshake",
    ] as const;
    const isGuestCustomerApi = guestCustomerApis.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (
      !role &&
      (isGuestCustomerApi ||
        pathname.startsWith("/api/pass/") ||
        pathname.startsWith("/api/sessions/"))
    ) {
      role = "CUSTOMER";
      bootstrappedGuest = true;
    }

    // Mirror guest page behavior: /pass loads under staff leftovers, but the
    // mint endpoint was still RBAC-blocked by FLOOR_MANAGER / GATE / CLUB JWT
    // or demo cookies — causing "Could not mint pass token" on live.
    if (isGuestCustomerApi && role && role !== "SUPER_ADMIN") {
      const probe = apiRoleAllowed(pathname, role);
      if (!probe.ok) {
        role = "CUSTOMER";
        bootstrappedGuest = true;
      }
    }

    if (
      pathname.startsWith("/api/admin") &&
      superAdminEmails().length > 0 &&
      !isSuperAdminEmail(jwtEmail)
    ) {
      return NextResponse.json(
        { ok: false, error: "403 Forbidden — Super Admin email required" },
        { status: 403 }
      );
    }

    const guard = apiRoleAllowed(pathname, role);
    if (!guard.ok) {
      return NextResponse.json(
        { ok: false, error: guard.reason },
        { status: guard.status }
      );
    }

    const apiResponse = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.getAll().forEach((cookie) => {
      apiResponse.cookies.set(cookie.name, cookie.value);
    });
    if (bootstrappedGuest) {
      await applyAuthCookies(apiResponse, "CUSTOMER", {
        userAgent: request.headers.get("user-agent"),
      });
    }
    if (role) apiResponse.headers.set("x-maitab-role", role);
    if (jwtRole) apiResponse.headers.set("x-maitab-auth", "jwt");
    return apiResponse;
  }

  if (!roleAllowed(pathname, role)) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.searchParams.set("denied", pathname);
    return NextResponse.redirect(dest);
  }

  if (bootstrappedGuest) {
    const next = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.getAll().forEach((cookie) => {
      next.cookies.set(cookie.name, cookie.value);
    });
    await applyAuthCookies(next, "CUSTOMER", {
      userAgent: request.headers.get("user-agent"),
    });
    next.headers.set("x-maitab-role", "CUSTOMER");
    return next;
  }

  if (role) response.headers.set("x-maitab-role", role);
  if (jwtRole) response.headers.set("x-maitab-auth", "jwt");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk)$).*)",
  ],
};
