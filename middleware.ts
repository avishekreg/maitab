import { NextResponse, type NextRequest } from "next/server";
import { apiRoleAllowed, roleAllowed } from "@/lib/auth/rbac";
import { isValidRole } from "@/lib/auth/claims";
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

const GUEST_APP_PREFIXES = ["/home", "/tab", "/pass", "/game"] as const;

function isGuestAppPath(pathname: string): boolean {
  return GUEST_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
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
  // Guest surfaces: honor CUSTOMER demo cookie over a leftover staff JWT
  // (common on production after switching demo roles).
  if (
    demo === "CUSTOMER" &&
    GUEST_APP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return "CUSTOMER";
  }
  if (jwtRole) return jwtRole;
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, role: jwtRole } = await updateSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/t/") ||
    pathname === "/login" ||
    pathname === "/admin/super-portal" ||
    pathname === "/super-admin-vault" ||
    pathname === "/onboard" ||
    pathname.startsWith("/onboard/") ||
    pathname === "/favicon.ico"
  ) {
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

  // Production: leftover staff JWT used to block /home. Guest app always
  // opens as CUSTOMER for the nightlife demo (matches local no-Supabase behavior).
  if (isGuestAppPath(pathname) && !roleAllowed(pathname, role)) {
    role = "CUSTOMER";
    bootstrappedGuest = true;
  }

  if (pathname.startsWith("/api")) {
    if (
      !role &&
      (pathname.startsWith("/api/pass/") ||
        pathname.startsWith("/api/sessions/") ||
        pathname.startsWith("/api/payments/settle") ||
        pathname.startsWith("/api/discounts/request") ||
        pathname.startsWith("/api/orders/handshake"))
    ) {
      role = "CUSTOMER";
      bootstrappedGuest = true;
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
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
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
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
