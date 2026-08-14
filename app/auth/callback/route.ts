import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  googleProfileFromUser,
  homeForGoogleRole,
  isSuperAdminEmail,
  oauthPhonePlaceholder,
  resolveGoogleAuthRole,
} from "@/lib/auth/google";
import {
  applyAuthCookies,
  clearAuthCookies,
} from "@/lib/security/session-cookies";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";

function loginErrorRedirect(origin: string, reason: string) {
  const dest = new URL("/login", origin);
  dest.searchParams.set("denied", "google");
  dest.searchParams.set("error", reason);
  return NextResponse.redirect(dest);
}

async function sealRedirect(
  cookieJar: NextResponse,
  origin: string,
  homePath: string,
  role: UserRole,
  request: NextRequest
) {
  const final = NextResponse.redirect(new URL(homePath, origin));
  cookieJar.cookies.getAll().forEach((cookie) => {
    final.cookies.set(cookie);
  });
  // Drop leftover demo-guest role cookies from prior /login demos.
  clearAuthCookies(final);
  await applyAuthCookies(final, role, {
    userAgent: request.headers.get("user-agent"),
  });
  final.headers.set("x-maitab-auth", "google");
  final.headers.set("x-maitab-role", role);
  return final;
}

/**
 * Google OAuth callback — never falls back to demo guest (Rahul).
 * Order: SUPER_ADMIN_EMAILS → existing staff → new user → /onboard.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  if (!code) return loginErrorRedirect(origin, "missing_code");
  if (!isSupabaseConfigured()) {
    return loginErrorRedirect(origin, "oauth_not_configured");
  }

  const cookieJar = NextResponse.redirect(new URL("/onboard", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieJar.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieJar.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return loginErrorRedirect(origin, "exchange_failed");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return loginErrorRedirect(origin, "no_email");
  }

  const profile = googleProfileFromUser(user);

  // ——— 1. Super Admin allowlist ———
  if (isSuperAdminEmail(profile.email)) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...(user.app_metadata ?? {}),
          role: "SUPER_ADMIN",
          provider: "google",
        },
        user_metadata: {
          ...(user.user_metadata ?? {}),
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
          email: profile.email,
        },
      });
      await admin.from("users").upsert(
        {
          id: user.id,
          full_name: profile.fullName,
          phone_number: oauthPhonePlaceholder(user.id),
          role: "SUPER_ADMIN",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // Cookie role still routes to console when service role upsert fails.
    }
    return sealRedirect(
      cookieJar,
      origin,
      ROLE_HOME.SUPER_ADMIN,
      "SUPER_ADMIN",
      request
    );
  }

  // ——— 2 / 3. Staff or new user ———
  let existingRole: UserRole | null = null;
  let isNewUser = true;
  let role: UserRole = "CUSTOMER";

  try {
    const admin = createAdminClient();
    const { data: byId } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (byId?.role) {
      existingRole = byId.role as UserRole;
      isNewUser = false;
    }

    role = resolveGoogleAuthRole(profile.email, existingRole);

    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role,
        provider: "google",
      },
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
        email: profile.email,
      },
    });

    if (isNewUser) {
      await admin.from("users").upsert(
        {
          id: user.id,
          full_name: profile.fullName,
          phone_number: oauthPhonePlaceholder(user.id),
          role,
          global_spend_tier: "BRONZE",
          favorite_drinks: [],
          autopay_status: "PENDING",
          lifetime_visits: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } else {
      await admin
        .from("users")
        .update({
          full_name: profile.fullName,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  } catch {
    role = resolveGoogleAuthRole(profile.email, null);
    isNewUser = true;
  }

  let homePath = homeForGoogleRole(role, isNewUser);

  // Safe next — never send OAuth users to demo guest /home.
  if (
    nextRaw &&
    nextRaw.startsWith("/") &&
    !nextRaw.startsWith("//") &&
    nextRaw !== "/home" &&
    !nextRaw.startsWith("/home?") &&
    !nextRaw.startsWith("/tab")
  ) {
    homePath = nextRaw;
  }

  if (role === "CUSTOMER") {
    homePath = isNewUser ? "/onboard" : "/home";
  }

  return sealRedirect(cookieJar, origin, homePath, role, request);
}
