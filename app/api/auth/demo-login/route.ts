import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidRole } from "@/lib/auth/claims";
import {
  DEMO_PASSWORD,
  PUBLIC_DEMO_USERS,
  demoUserForRole,
  isPublicDemoRole,
  portalKeyMatches,
} from "@/lib/auth/demo-users";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Public demo roster only — never Super Admin credentials. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    password: DEMO_PASSWORD,
    users: PUBLIC_DEMO_USERS.map((u) => ({
      role: u.role,
      email: u.email,
      name: u.name,
      home: u.home,
      description: u.description,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: string;
    portalKey?: string;
  };
  if (!isValidRole(body.role)) {
    return NextResponse.json({ ok: false, reason: "Invalid role" }, { status: 400 });
  }

  // Super Admin never via public demo cards — portal key required.
  if (body.role === "SUPER_ADMIN") {
    const headerKey = request.headers.get("x-maitab-portal-key");
    const key = body.portalKey ?? headerKey;
    if (!portalKeyMatches(key)) {
      return NextResponse.json(
        { ok: false, reason: "Forbidden" },
        { status: 403 }
      );
    }
  } else if (!isPublicDemoRole(body.role)) {
    return NextResponse.json({ ok: false, reason: "Forbidden" }, { status: 403 });
  }

  const account = demoUserForRole(body.role);
  const email =
    body.role === "SUPER_ADMIN"
      ? account.email || process.env.SUPER_ADMIN_DEMO_EMAIL || ""
      : account.email;
  const password =
    body.role === "SUPER_ADMIN"
      ? account.password || process.env.SUPER_ADMIN_DEMO_PASSWORD || ""
      : DEMO_PASSWORD;

  if (body.role === "SUPER_ADMIN" && (!email || !password)) {
    // Cookie-only unlock when env credentials are not wired yet.
    const response = NextResponse.json({
      ok: true,
      role: body.role,
      home: account.home,
      mode: "cookie",
    });
    response.cookies.set("maitab_demo_role", body.role, {
      path: "/",
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
      httpOnly: false,
    });
    return response;
  }

  const response = NextResponse.json({
    ok: true,
    role: body.role,
    email: body.role === "SUPER_ADMIN" ? undefined : email,
    home: account.home,
    mode: isSupabaseConfigured() ? "jwt+cookie" : "cookie",
  });
  response.cookies.set("maitab_demo_role", body.role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  if (!isSupabaseConfigured() || !email || !password) {
    return response;
  }

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: true,
        role: body.role,
        home: account.home,
        mode: "cookie",
        warning: "Auth sign-in skipped — using demo role cookie.",
      },
      { headers: response.headers }
    );
  }

  return response;
}
