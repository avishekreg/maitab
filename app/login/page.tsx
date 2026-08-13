"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEMO_PASSWORD, PUBLIC_DEMO_USERS } from "@/lib/auth/demo-users";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get("denied");
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function enterDemo(role: UserRole, home: string) {
    setLoadingRole(role);
    setNote(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        mode?: string;
        warning?: string;
        email?: string;
      };
      if (!data.ok) {
        setNote("Sign-in blocked for this role.");
        return;
      }
      if (data.warning) setNote(data.warning);
      else setNote(`${data.email ?? role} · ${data.mode ?? "cookie"}`);
      router.push(home);
    } catch {
      document.cookie = `maitab_demo_role=${role}; path=/; max-age=604800; samesite=lax`;
      router.push(home);
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-nightlife-bg px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-nightlife-radial opacity-90" />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8">
          <MaiTabLogo variant="FullLogoWithText" className="h-11 w-auto" />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Venue demo logins
          </h1>
          <p className="mt-2 max-w-xl text-sm text-nightlife-muted">
            One-click entry for floor roles. Shared demo password{" "}
            <code className="rounded border border-champagne/20 bg-white/[0.04] px-1.5 py-0.5 text-accent-gold">
              {DEMO_PASSWORD}
            </code>
            .
          </p>
          {denied ? (
            <p className="mt-3 text-sm text-accent-ruby">
              Access denied for {denied}. Pick a role that can open that route.
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PUBLIC_DEMO_USERS.map((user) => {
            const busy = loadingRole === user.role;
            return (
              <button
                key={user.role}
                type="button"
                disabled={loadingRole !== null}
                onClick={() => void enterDemo(user.role, user.home)}
                className={cn(
                  "rounded-2xl border border-champagne/20 bg-white/[0.04] p-4 text-left backdrop-blur-2xl transition",
                  "hover:border-accent-violet/40 hover:bg-white/[0.06]",
                  "disabled:cursor-wait disabled:opacity-60",
                  busy && "ring-1 ring-accent-violet/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold text-white">
                    {user.name}
                  </p>
                  <span className="rounded-lg border border-champagne/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-nightlife-muted">
                    {user.role.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-nightlife-muted">
                  {user.description}
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <p>
                    <span className="text-nightlife-muted">Email · </span>
                    <span className="text-white">{user.email}</span>
                  </p>
                  <p>
                    <span className="text-nightlife-muted">Opens · </span>
                    <span className="text-accent-gold">{user.home}</span>
                  </p>
                </div>
                <p className="mt-3 text-xs font-semibold text-accent-violet">
                  {busy ? "Signing in…" : "Enter as this role →"}
                </p>
              </button>
            );
          })}
        </div>

        {note ? (
          <p className="mt-4 text-xs text-nightlife-muted">{note}</p>
        ) : null}

        <div className="mt-6">
          <NeonButton
            tone="ghost"
            size="sm"
            onClick={() => router.push("/home")}
          >
            Open customer demo
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[100dvh] place-items-center bg-nightlife-bg text-nightlife-muted">
          Loading demo logins…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
