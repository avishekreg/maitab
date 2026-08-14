"use client";

import { AdminNav, type AdminNavRole } from "@/components/admin/admin-nav";
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
  heroTitle?: boolean;
  hideTitle?: boolean;
}

export function AdminShell({
  role,
  title,
  subtitle,
  actions,
  children,
  showVenueSwitcher = true,
  heroTitle = false,
  hideTitle = false,
}: AdminShellProps) {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none print:hidden fixed inset-0 bg-nightlife-radial opacity-90" />
      <AdminNav role={role as AdminNavRole} showVenueSwitcher={showVenueSwitcher} />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6">
        {!hideTitle ? (
        <div className="print:hidden flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className={
                heroTitle
                  ? "font-display text-4xl font-black uppercase tracking-tight text-white md:text-5xl"
                  : "font-display text-2xl font-black tracking-tight text-white sm:text-3xl"
              }
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl font-sans text-sm text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        ) : null}

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
              "mt-2 font-display text-3xl font-extrabold tracking-tight tabular-nums",
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
