import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidRole } from "@/lib/auth/claims";
import {
  DEMO_EMAILS,
  DEMO_PASSWORD,
  DEMO_USERS,
  demoUserForRole,
} from "@/lib/auth/demo-users";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** List all demo accounts for QA (no secrets beyond the shared demo password). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    password: DEMO_PASSWORD,
    users: DEMO_USERS.map((u) => ({
      role: u.role,
      email: u.email,
      name: u.name,
      home: u.home,
      description: u.description,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { role?: string };
  if (!isValidRole(body.role)) {
    return NextResponse.json({ ok: false, reason: "Invalid role" }, { status: 400 });
  }

  const account = demoUserForRole(body.role);

  const response = NextResponse.json({
    ok: true,
    role: body.role,
    email: account.email,
    home: account.home,
    mode: isSupabaseConfigured() ? "jwt+cookie" : "cookie",
  });
  response.cookies.set("maitab_demo_role", body.role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  if (!isSupabaseConfigured()) {
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
    email: DEMO_EMAILS[body.role],
    password: DEMO_PASSWORD,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: true,
        role: body.role,
        email: account.email,
        home: account.home,
        mode: "cookie",
        warning: `JWT login failed (${error.message}). Using demo cookie.`,
      },
      { headers: response.headers }
    );
  }

  return response;
}
