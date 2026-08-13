import { NextResponse, type NextRequest } from "next/server";
import { apiRoleAllowed, roleAllowed } from "@/lib/auth/rbac";
import { isValidRole } from "@/lib/auth/claims";
import type { UserRole } from "@/lib/types";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const DEMO_ROLE_COOKIE = "maitab_demo_role";

function readDemoRole(request: NextRequest): UserRole | null {
  const value = request.cookies.get(DEMO_ROLE_COOKIE)?.value;
  return isValidRole(value) ? value : null;
}

function resolveRole(jwtRole: UserRole | null, request: NextRequest): UserRole | null {
  if (jwtRole) return jwtRole;
  const demo = readDemoRole(request);
  if (demo) return demo;
  // Offline / unconfigured: allow demo cookie absence → CUSTOMER for page UX.
  if (!isSupabaseConfigured()) return "CUSTOMER";
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, role: jwtRole } = await updateSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/t/") ||
    pathname === "/login" ||
    pathname === "/admin/super-portal" ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  const role = resolveRole(jwtRole, request);

  // --- Secure /api/* with JWT / demo-role claims ---
  if (pathname.startsWith("/api")) {
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
    // Preserve refreshed auth cookies from updateSession.
    response.cookies.getAll().forEach((cookie) => {
      apiResponse.cookies.set(cookie.name, cookie.value);
    });
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

  if (role) response.headers.set("x-maitab-role", role);
  if (jwtRole) response.headers.set("x-maitab-auth", "jwt");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
