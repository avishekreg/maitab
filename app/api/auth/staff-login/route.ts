import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  DEMO_PASSWORD,
  PUBLIC_DEMO_USERS,
  pinMatchesRole,
  resolveDemoEmail,
} from "@/lib/auth/demo-users";
import { isSuperAdminEmail } from "@/lib/auth/google";
import {
  applyAuthCookies,
  clearAuthCookies,
} from "@/lib/security/session-cookies";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ROLE_HOME, type UserRole } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; pin?: string };
  const email = resolveDemoEmail(body.email || "");
  const pin = body.pin || "";

  if (!email || !pin) {
    return NextResponse.json(
      { ok: false, reason: "Email and PIN required" },
      { status: 400 }
    );
  }

  const expectedPin = process.env.STAFF_ACCESS_PIN || DEMO_PASSWORD;
  const pinOk =
    pin === expectedPin ||
    (isSuperAdminEmail(email) && pin === expectedPin);

  if (isSuperAdminEmail(email)) {
    if (!pinOk) {
      return NextResponse.json(
        { ok: false, reason: "Invalid email or PIN" },
        { status: 401 }
      );
    }
    const response = NextResponse.json({
      ok: true,
      role: "SUPER_ADMIN",
      home: ROLE_HOME.SUPER_ADMIN,
      name: "Platform Owner",
    });
    clearAuthCookies(response);
    await applyAuthCookies(response, "SUPER_ADMIN", {
      userAgent: request.headers.get("user-agent"),
    });
    return response;
  }

  const account = PUBLIC_DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email
  );

  if (!account) {
    return NextResponse.json(
      { ok: false, reason: "No staff profile for this email" },
      { status: 404 }
    );
  }

  if (!pinMatchesRole(pin, account.role as UserRole)) {
    return NextResponse.json(
      { ok: false, reason: "Invalid email or PIN" },
      { status: 401 }
    );
  }

  const role = account.role as UserRole;
  const response = NextResponse.json({
    ok: true,
    role,
    home: account.home,
    name: account.name,
    mode: isSupabaseConfigured() ? "jwt+cookie" : "cookie",
  });

  clearAuthCookies(response);
  await applyAuthCookies(response, role, {
    userAgent: request.headers.get("user-agent"),
  });

  if (isSupabaseConfigured()) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
  }

  return response;
}
