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
      // Never write auth cookies from JS (HttpOnly). Retry via API is required.
      setNote("Sign-in failed — retry demo login.");
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0E14] px-4 py-10 text-[#F8FAFC]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_480px_at_12%_-8%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(780px_420px_at_92%_0%,rgba(6,182,212,0.12),transparent_50%)]"
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8">
          <MaiTabLogo
            variant="FullLogoWithText"
            onDark
            className="h-11 w-auto min-w-[11rem]"
          />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Venue demo logins
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-[#E2E8F0]">
            One-click entry for floor roles. Shared demo password{" "}
            <code className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-amber-400">
              {DEMO_PASSWORD}
            </code>
            .
          </p>
          {denied ? (
            <p className="mt-3 text-sm text-rose-400">
              Access denied for {denied}. Pick a role that can open that route.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PUBLIC_DEMO_USERS.map((user) => {
            const busy = loadingRole === user.role;
            return (
              <button
                key={user.role}
                type="button"
                disabled={loadingRole !== null}
                onClick={() => void enterDemo(user.role, user.home)}
                className={cn(
                  "flex flex-col rounded-2xl border border-white/10 bg-[#12151A]/90 p-5 text-left shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl transition",
                  "hover:border-[#A855F7]/50 hover:bg-[#161B22]",
                  "disabled:cursor-wait disabled:opacity-60",
                  busy && "ring-1 ring-[#A855F7]/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold tracking-normal text-[#F8FAFC]">
                    {user.name}
                  </p>
                  <span className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E2E8F0]">
                    {user.role.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-[#E2E8F0]">
                  {user.description}
                </p>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="break-all">
                    <span className="text-[#94A3B8]">Email · </span>
                    <span className="font-medium text-cyan-400">{user.email}</span>
                  </p>
                  <p>
                    <span className="text-[#94A3B8]">Opens · </span>
                    <span className="font-medium text-amber-400">{user.home}</span>
                  </p>
                </div>

                <p className="mt-4 block text-sm font-semibold text-[#A855F7]">
                  {busy ? "Signing in…" : "Enter as this role →"}
                </p>
              </button>
            );
          })}
        </div>

        {note ? (
          <p className="mt-4 text-sm text-[#E2E8F0]/80">{note}</p>
        ) : null}

        <div className="mt-6">
          <NeonButton
            tone="ghost"
            size="sm"
            className="border-white/20 bg-white/5 text-[#F8FAFC] hover:bg-white/10"
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
        <div className="grid min-h-[100dvh] place-items-center bg-[#0B0E14] text-[#E2E8F0]">
          Loading demo logins…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
