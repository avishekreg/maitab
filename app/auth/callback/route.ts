import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  googleProfileFromUser,
  homeForGoogleRole,
  isSuperAdminEmail,
  oauthPhonePlaceholder,
  resolveGoogleAuthRole,
} from "@/lib/auth/google";
import { applyAuthCookies } from "@/lib/security/session-cookies";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/types";

function loginErrorRedirect(origin: string, reason: string) {
  const dest = new URL("/login", origin);
  dest.searchParams.set("denied", "google");
  dest.searchParams.set("error", reason);
  return NextResponse.redirect(dest);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  if (!code) return loginErrorRedirect(origin, "missing_code");
  if (!isSupabaseConfigured()) {
    return loginErrorRedirect(origin, "oauth_not_configured");
  }

  // Cookie jar response — session cookies are written here during exchange.
  let homePath = "/home";
  let resolvedRole: UserRole = "CUSTOMER";
  const response = NextResponse.redirect(new URL(homePath, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
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
  let existingRole: UserRole | null = null;
  let isNewUser = true;

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (existing?.role) {
      existingRole = existing.role as UserRole;
      isNewUser = false;
    }

    const role = isSuperAdminEmail(profile.email)
      ? ("SUPER_ADMIN" as const)
      : resolveGoogleAuthRole(profile.email, existingRole);

    resolvedRole = role;

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

    homePath =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : homeForGoogleRole(role, isNewUser);
  } catch {
    resolvedRole = resolveGoogleAuthRole(profile.email, null);
    homePath = homeForGoogleRole(resolvedRole, true);
  }

  // Rebuild redirect with resolved home while preserving Set-Cookie from exchange.
  const final = NextResponse.redirect(new URL(homePath, origin));
  response.cookies.getAll().forEach((cookie) => {
    final.cookies.set(cookie.name, cookie.value);
  });
  await applyAuthCookies(final, resolvedRole, {
    userAgent: request.headers.get("user-agent"),
  });
  final.headers.set("x-maitab-auth", "google");
  final.headers.set("x-maitab-role", resolvedRole);
  return final;
}
