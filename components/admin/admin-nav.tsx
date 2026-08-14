"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VenueSwitcher } from "@/components/admin/VenueSwitcher";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export type AdminNavRole = Extract<
  UserRole,
  "CLUB_ADMIN" | "SUPER_ADMIN" | "FLOOR_MANAGER" | "CAPTAIN"
>;

const CLUB_NAV = [
  { href: "/admin/club", label: "Venue" },
  { href: "/admin/club/analytics", label: "Telemetry" },
  { href: "/admin/club/promos", label: "Flash" },
  { href: "/admin/club/settings", label: "Settings" },
  { href: "/admin/manager", label: "Floor" },
  { href: "/kds", label: "KDS" },
  { href: "/waiter", label: "Waiter" },
  { href: "/gate", label: "Gate" },
  { href: "/av-panel", label: "AV" },
];

const MANAGER_NAV = [
  { href: "/admin/manager", label: "Shifts" },
  { href: "/admin/club", label: "Venue" },
  { href: "/admin/club/promos", label: "Flash" },
  { href: "/admin/club/settings", label: "Settings" },
  { href: "/kds", label: "KDS" },
  { href: "/waiter", label: "Waiter" },
];

const SUPER_NAV = [
  { href: "/admin/super", label: "Command" },
  { href: "/admin/super/telemetry", label: "Telemetry" },
  { href: "/admin/super/config", label: "Integrations" },
  { href: "/admin/super/vault", label: "Vault" },
];

function navForRole(role: AdminNavRole) {
  if (role === "SUPER_ADMIN") return SUPER_NAV;
  if (role === "FLOOR_MANAGER" || role === "CAPTAIN") return MANAGER_NAV;
  return CLUB_NAV;
}

export function AdminNav({
  role,
  showVenueSwitcher = true,
}: {
  role: AdminNavRole;
  showVenueSwitcher?: boolean;
}) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const venueOps =
    role === "CLUB_ADMIN" ||
    role === "FLOOR_MANAGER" ||
    role === "CAPTAIN";

  return (
    <header className="print:hidden sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3.5">
        <BrandLockup />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto md:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/club" &&
                item.href !== "/admin/super" &&
                pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-3">
          {showVenueSwitcher && venueOps ? <VenueSwitcher compact /> : null}
          <StatusPill
            label={role}
            tone={role === "SUPER_ADMIN" ? "violet" : "gold"}
            className="hidden sm:inline-flex"
          />
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            Logout
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-6 pb-3 md:hidden">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
                active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
