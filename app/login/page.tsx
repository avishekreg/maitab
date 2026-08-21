"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { QuickDemoSwitcher } from "@/components/auth/QuickDemoSwitcher";
import { GoogleContinueButton } from "@/components/auth/GoogleContinueButton";
import { BrandLockup } from "@/components/branding/brand-lockup";
import {
  DEMO_PASSWORD,
  PUBLIC_DEMO_USERS,
} from "@/lib/auth/demo-users";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAFF_ROLES: UserRole[] = [
  "CLUB_ADMIN",
  "FLOOR_MANAGER",
  "CAPTAIN",
  "BARTENDER",
  "GATE_STAFF",
  "SAARTHI_DRIVER",
];

function LoginHub() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get("denied");
  const oauthError = params.get("error");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function staffSignIn() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        home?: string;
        reason?: string;
        name?: string;
      };
      if (!data.ok) {
        setNote(data.reason ?? "Sign-in failed.");
        return;
      }
      setNote(data.name ? `Welcome, ${data.name}` : "Signed in");
      router.push(data.home ?? "/admin/club");
    } catch {
      setNote("Unable to reach sign-in service.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !busy && email.includes("@") && pin.length >= 4;

  return (
    <div className="theme-dark-capsule min-h-[100dvh] bg-[#0B0E14] px-4 py-10 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_480px_at_12%_-8%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(780px_420px_at_92%_0%,rgba(6,182,212,0.12),transparent_50%)]"
      />
      <div className="relative mx-auto w-full max-w-md pb-24">
        <BrandLockup href="/" onDark className="!bg-zinc-900" />

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-white">
          Universal login
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          One portal for Super Admin, venue owners, and floor staff.
        </p>

        {denied === "403" || oauthError === "super_admin_forbidden" ? (
          <p className="mt-3 text-sm text-rose-400">
            403 Forbidden — this identity cannot open the Super Admin console.
          </p>
        ) : denied ? (
          <p className="mt-3 text-sm text-rose-400">
            Access denied{oauthError ? ` (${oauthError})` : ""}.
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/90 p-6 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Fast Google Auth
          </p>
          <div className="mt-4">
            <GoogleContinueButton />
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Routes automatically to your console based on your verified email.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/90 p-6 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Staff & venue quick access
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Club Admins, Floor Managers, Bartenders, and Gate Staff — work email
            + PIN.
          </p>

          <label className="mt-4 block text-sm text-zinc-300">
            Work email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="club@maitab.demo"
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-500"
            />
          </label>
          <label className="mt-3 block text-sm text-zinc-300">
            PIN
            <input
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Staff PIN"
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-500"
            />
          </label>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void staffSignIn()}
            className={cn(
              "mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition",
              canSubmit
                ? "bg-violet-600 shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:bg-violet-500"
                : "cursor-not-allowed bg-violet-950 text-zinc-500"
            )}
          >
            {busy ? "Signing in…" : "Sign in to floor ops"}
          </button>

          {note ? (
            <p className="mt-3 text-sm text-zinc-300">{note}</p>
          ) : null}

          <details className="mt-4 text-xs text-zinc-500">
            <summary className="cursor-pointer text-zinc-400">
              Demo staff emails
            </summary>
            <ul className="mt-2 space-y-1">
              {PUBLIC_DEMO_USERS.filter((u) =>
                STAFF_ROLES.includes(u.role)
              ).map((u) => (
                <li key={u.email}>
                  <button
                    type="button"
                    className="text-left text-cyan-400 hover:underline"
                    onClick={() => {
                      setEmail(u.email);
                      setPin(DEMO_PASSWORD);
                    }}
                  >
                    {u.role.replaceAll("_", " ")} · {u.email}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2">Demo PIN · {DEMO_PASSWORD}</p>
          </details>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          <Link
            href="/onboard"
            className="font-semibold text-violet-400 transition hover:text-violet-300"
          >
            New Venue? Start B2B Onboarding ➔
          </Link>
        </p>
      </div>
      <QuickDemoSwitcher />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[100dvh] place-items-center bg-[#0B0E14] text-zinc-200">
          Loading login…
        </div>
      }
    >
      <LoginHub />
    </Suspense>
  );
}
