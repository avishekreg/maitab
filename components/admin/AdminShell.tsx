"use client";

import { useState } from "react";
import { AdminNav, type AdminNavRole } from "@/components/admin/admin-nav";
import {
  InteractiveKpiCard,
  KpiDrillDrawer,
  type KpiDrillContent,
} from "@/components/admin/KpiDrillDrawer";
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
    <div className="min-h-screen bg-[#faf9f5] text-zinc-900">
      <AdminNav role={role as AdminNavRole} showVenueSwitcher={showVenueSwitcher} />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6">
        {!hideTitle ? (
        <div className="print:hidden flex flex-wrap items-end justify-between gap-4 animate-lux-enter">
          <div>
            <h1
              className={
                heroTitle
                  ? "font-display text-4xl font-extrabold uppercase tracking-tight text-zinc-950 md:text-5xl"
                  : "font-display text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl"
              }
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm font-semibold tracking-wide text-zinc-600">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        ) : null}

        <div className="mt-6 flex-1 animate-lux-enter">{children}</div>
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
    <section className={cn("lux-glass-cream overflow-hidden rounded-2xl", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/80 px-5 py-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm font-semibold tracking-wide text-zinc-600">{description}</p>
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
  items: {
    id?: string;
    label: string;
    value: string;
    tone?: "gold" | "ruby" | "default";
    valueClassName?: string;
    drill?: KpiDrillContent;
  }[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = items.find((i) => i.id === openId && i.drill);

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-3",
          items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
        )}
      >
        {items.map((item) => {
          const interactive = Boolean(item.drill && item.id);
          if (interactive && item.id) {
            return (
              <InteractiveKpiCard
                key={item.label}
                label={item.label}
                value={item.value}
                tone={item.tone}
                valueClassName={item.valueClassName}
                onClick={() => setOpenId(item.id!)}
              />
            );
          }
          return (
            <div
              key={item.label}
              className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:border-zinc-300"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-2 font-display font-extrabold tracking-tight text-2xl xl:text-3xl whitespace-nowrap text-zinc-950",
                  item.tone === "gold" && "text-amber-600",
                  item.tone === "ruby" && "text-rose-600"
                )}
              >
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
      <KpiDrillDrawer
        open={Boolean(active?.drill)}
        onClose={() => setOpenId(null)}
        content={active?.drill ?? null}
      />
    </>
  );
}
