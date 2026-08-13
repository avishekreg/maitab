import { NextResponse, type NextRequest } from "next/server";
import { isValidRole } from "@/lib/auth/claims";
import { apiRoleAllowed, type ApiGuardResult } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/types";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const DEMO_ROLE_COOKIE = "maitab_demo_role";

export function readDemoRole(request: NextRequest): UserRole | null {
  const value = request.cookies.get(DEMO_ROLE_COOKIE)?.value;
  return isValidRole(value) ? value : null;
}

export async function resolveRequestRole(
  request: NextRequest
): Promise<{ role: UserRole | null; auth: "jwt" | "demo" | "none" }> {
  const { role: jwtRole } = await updateSession(request);
  if (jwtRole) return { role: jwtRole, auth: "jwt" };

  const demo = readDemoRole(request);
  if (demo) return { role: demo, auth: "demo" };

  // Unconfigured local mode defaults customer for attach/pass flows only when
  // route allows it — callers still enforce via apiRoleAllowed.
  if (!isSupabaseConfigured()) {
    return { role: null, auth: "none" };
  }

  return { role: null, auth: "none" };
}

export async function enforceApiRole(
  request: NextRequest,
  pathname = request.nextUrl.pathname
): Promise<ApiGuardResult | NextResponse> {
  const { role, auth } = await resolveRequestRole(request);
  const effective =
    role ?? (!isSupabaseConfigured() ? ("CUSTOMER" as UserRole) : null);

  const result = apiRoleAllowed(pathname, effective);
  if (result.ok) {
    return { ...result, role: effective };
  }

  return NextResponse.json(
    {
      ok: false,
      error: result.reason,
      auth,
      required: true,
    },
    { status: result.status }
  );
}

export function isDenied(
  value: ApiGuardResult | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
