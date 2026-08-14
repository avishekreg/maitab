import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { oauthCallbackUrl } from "@/lib/auth/google";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Starts Google OAuth (server-side helper for non-browser clients).
 * Browser flows should prefer supabase.auth.signInWithOAuth from the button.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "OAuth not configured" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { next?: string };
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://127.0.0.1:3100";

  let redirectTo = oauthCallbackUrl(origin);
  if (body.next?.startsWith("/")) {
    const u = new URL(redirectTo);
    u.searchParams.set("next", body.next);
    redirectTo = u.toString();
  }

  const cookieStore = cookies();
  const response = NextResponse.json({ ok: true });

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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { ok: false, reason: error?.message ?? "OAuth start failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, url: data.url });
}
