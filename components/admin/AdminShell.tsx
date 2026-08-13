"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  role: "CLUB_ADMIN" | "SUPER_ADMIN";
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const CLUB_NAV = [
  { href: "/admin/club", label: "Venue" },
  { href: "/kds", label: "KDS" },
  { href: "/gate", label: "Gate" },
  { href: "/av-panel", label: "AV" },
];

const SUPER_NAV = [
  { href: "/admin/super", label: "Command" },
  { href: "/admin/super/config", label: "Integrations" },
  { href: "/admin/club", label: "Sample venue" },
];

export function AdminShell({
  role,
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const nav = role === "SUPER_ADMIN" ? SUPER_NAV : CLUB_NAV;

  return (
    <div className="min-h-[100dvh] bg-nightlife-bg text-white">
      <div className="pointer-events-none fixed inset-0 bg-nightlife-radial opacity-90" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-nightlife-bg/85 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="shrink-0">
                <MaiTabLogo variant="IconOnly" className="h-8 w-8" />
              </Link>
              <div className="min-w-0 leading-tight">
                <p className="font-display text-sm font-bold tracking-wide text-white">
                  mAITab
                </p>
                <p className="truncate text-[11px] uppercase tracking-[0.16em] text-nightlife-muted">
                  {role === "SUPER_ADMIN" ? "Platform ops" : "Venue ops"}
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition",
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-nightlife-muted hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <StatusPill
                label={role}
                tone={role === "SUPER_ADMIN" ? "violet" : "gold"}
                className="hidden sm:inline-flex"
              />
              <Link
                href="/login"
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-nightlife-muted transition hover:border-white/20 hover:text-white"
              >
                Switch
              </Link>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-3 md:hidden">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-sm transition",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-nightlife-muted hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-nightlife-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>

        <main className="mt-8 flex-1">{children}</main>
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
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-nightlife-elevated/60",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-nightlife-muted">{description}</p>
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
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-nightlife-elevated/90 px-4 py-4 sm:px-5"
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-nightlife-muted">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-2xl font-bold tabular-nums sm:text-3xl",
              item.tone === "gold" && "text-accent-gold",
              item.tone === "ruby" && "text-accent-ruby",
              (!item.tone || item.tone === "default") && "text-white"
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
