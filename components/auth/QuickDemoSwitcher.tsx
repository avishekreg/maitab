"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";
import {
  DEMO_PASSWORD,
  PUBLIC_DEMO_USERS,
} from "@/lib/auth/demo-users";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type SwitcherRole = Extract<
  UserRole,
  | "CLUB_ADMIN"
  | "FLOOR_MANAGER"
  | "BARTENDER"
  | "GATE_STAFF"
  | "SAARTHI_DRIVER"
  | "CUSTOMER"
  | "CAPTAIN"
  | "AV_CONTROLLER"
>;

const QUICK_ROLES: {
  role: SwitcherRole | "GUEST_TAB";
  label: string;
  hint: string;
  home?: string;
}[] = [
  {
    role: "CLUB_ADMIN",
    label: "Club Admin",
    hint: "owner@neon.demo",
  },
  {
    role: "FLOOR_MANAGER",
    label: "Floor Manager",
    hint: "PIN 1111",
  },
  {
    role: "BARTENDER",
    label: "Bartender KDS",
    hint: "PIN 2222",
  },
  {
    role: "GATE_STAFF",
    label: "Gatekeeper",
    hint: "PIN 3333",
  },
  {
    role: "SAARTHI_DRIVER",
    label: "mAISaarthi",
    hint: "PIN 4444",
  },
  {
    role: "CUSTOMER",
    label: "Guest live tab",
    hint: "VIP-04",
    home: "/tab?v=neon&t=VIP-04",
  },
  {
    role: "CAPTAIN",
    label: "Floor Captain",
    hint: "captain@maitab.demo",
  },
  {
    role: "AV_CONTROLLER",
    label: "AV Controller",
    hint: "av@maitab.demo",
  },
];

export function QuickDemoSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enter(role: SwitcherRole | "GUEST_TAB", home?: string) {
    setError(null);
    if (role === "GUEST_TAB" || role === "CUSTOMER") {
      router.push(home ?? "/tab?v=neon&t=VIP-04");
      return;
    }
    setBusy(role);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        home?: string;
        reason?: string;
      };
      if (!data.ok) {
        setError(data.reason ?? "Unable to switch role");
        return;
      }
      const fallback = PUBLIC_DEMO_USERS.find((u) => u.role === role)?.home;
      router.push(data.home ?? fallback ?? "/home");
    } catch {
      setError("Unable to reach demo login.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 max-sm:bottom-6"
      >
        <Zap className="h-4 w-4" />
        Quick Demo Switcher
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close demo switcher"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-[#faf9f5] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight text-zinc-950">
                  ⚡ Quick Demo Switcher
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-600">
                  1-click role entry. Super Admin still requires Google OAuth.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {QUICK_ROLES.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  disabled={busy === item.role}
                  onClick={() => void enter(item.role, item.home)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300 hover:shadow-sm disabled:opacity-50"
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900">
                      {item.label}
                    </span>
                    <span className="block font-mono text-[11px] text-zinc-500">
                      {item.hint}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-violet-600">
                    {busy === item.role ? "Entering…" : "Enter ➔"}
                  </span>
                </button>
              ))}
              <a
                href="/admin/super-portal"
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">
                    Super Admin
                  </span>
                  <span className="block font-mono text-[11px] text-zinc-500">
                    Google OAuth · SUPER_ADMIN_EMAILS
                  </span>
                </span>
                <span className="text-xs font-semibold text-amber-800">Portal ➔</span>
              </a>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : (
              <p className="mt-3 text-[11px] text-zinc-500">
                Staff PIN fallback · {DEMO_PASSWORD}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
