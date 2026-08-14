"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VenueSwitcher } from "@/components/admin/VenueSwitcher";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type AdminShellRole = Extract<
  UserRole,
  "CLUB_ADMIN" | "SUPER_ADMIN" | "FLOOR_MANAGER" | "CAPTAIN"
>;

interface AdminShellProps {
  role: AdminShellRole;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  showVenueSwitcher?: boolean;
}

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
  { href: "/admin/club", label: "Sample venue" },
];

function navForRole(role: AdminShellRole) {
  if (role === "SUPER_ADMIN") return SUPER_NAV;
  if (role === "FLOOR_MANAGER" || role === "CAPTAIN") return MANAGER_NAV;
  return CLUB_NAV;
}

export function AdminShell({
  role,
  title,
  subtitle,
  actions,
  children,
  showVenueSwitcher = true,
}: AdminShellProps) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const venueOps =
    role === "CLUB_ADMIN" ||
    role === "FLOOR_MANAGER" ||
    role === "CAPTAIN";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-nightlife-radial opacity-90" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 pb-10 pt-0 sm:px-6">
        <header className="sticky top-0 z-30 -mx-4 border-b border-zinc-800 bg-zinc-950 sm:-mx-6">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <Link href="/" className="shrink-0">
                <MaiTabLogo variant="FullLogoWithText" className="h-8 w-auto" />
              </Link>
              <p className="hidden truncate text-[11px] uppercase tracking-[0.16em] text-zinc-400 lg:block">
                {role === "SUPER_ADMIN" ? "Platform ops" : "Venue ops"}
              </p>
            </div>

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
                      "rounded-lg px-3 py-1.5 text-sm transition",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {showVenueSwitcher && venueOps ? <VenueSwitcher /> : null}
              <StatusPill
                label={role}
                tone={role === "SUPER_ADMIN" ? "violet" : "gold"}
                className="hidden sm:inline-flex"
              />
              <Link
                href="/login"
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                Switch
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
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-zinc-100 sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="mt-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("optimus-glass rounded-xl", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function KpiStrip({
  items,
}: {
  items: { label: string; value: string; tone?: "gold" | "ruby" | "default" }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="optimus-glass rounded-xl px-4 py-4 sm:px-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-3xl tabular-nums",
              item.tone === "gold" && "text-accent-gold",
              item.tone === "ruby" && "text-accent-ruby",
              (!item.tone || item.tone === "default") && "text-foreground"
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
