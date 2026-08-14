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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav role={role as AdminNavRole} showVenueSwitcher={showVenueSwitcher} />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6">
        {!hideTitle ? (
        <div className="print:hidden flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className={
                heroTitle
                  ? "font-display text-4xl font-extrabold uppercase tracking-tight text-white md:text-5xl"
                  : "font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
              }
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl font-medium text-zinc-400">{subtitle}</p>
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
    <section className={cn("overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl backdrop-blur-xl", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">{title}</h2>
          {description ? (
            <p className="mt-1 font-medium text-zinc-400">{description}</p>
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
        <div key={item.label} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl backdrop-blur-xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-display text-2xl font-extrabold tracking-tight xl:text-3xl",
              item.tone === "gold" && "text-amber-400",
              item.tone === "ruby" && "text-rose-400",
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
