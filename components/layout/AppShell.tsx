"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gamepad2,
  Ghost,
  QrCode,
  Receipt,
  Sparkles,
  Ticket,
} from "lucide-react";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { GuestHeaderMenu } from "@/components/layout/GuestHeaderMenu";
import { ResponsibleBadges } from "@/components/branding/responsible-badges";
import { SaarthiProvider } from "@/components/saarthi/SaarthiProvider";
import { TierBadge } from "@/components/theme/TierChrome";
import { TierThemeProvider } from "@/components/theme/TierThemeProvider";
import { PageEnter } from "@/components/ui/PageEnter";
import { useSessionStore } from "@/lib/store/session-store";
import { getTierTheme } from "@/lib/theme/tiers";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home", icon: Sparkles },
  { href: "/tab", label: "Tab", icon: Receipt },
  { href: "/tab/cloak", label: "Cloak", icon: Ghost, cloak: true },
  { href: "/game", label: "Game", icon: Gamepad2 },
  { href: "/pass", label: "Pass", icon: Ticket },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
  title?: string;
  showComplianceStrip?: boolean;
}

export function AppShell({
  children,
  showNav = true,
  title,
  showComplianceStrip = true,
}: AppShellProps) {
  const pathname = usePathname();
  const tier = useSessionStore((s) => s.user.global_spend_tier);
  const tableCode =
    useSessionStore((s) => s.session.primary_table_id) || "TABLE";
  const theme = getTierTheme(tier);
  const onCloak = pathname.startsWith("/tab/cloak");

  return (
    <TierThemeProvider tier={tier}>
      <SaarthiProvider>
        <div className="relative min-h-[100dvh] bg-background text-foreground">
          <div
            className={cn("pointer-events-none absolute inset-0", theme.ambient)}
          />

          <header className="optimus-glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 backdrop-blur-2xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLockup href="/home" />
                {title ? (
                  <p className="hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                    {title}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden max-w-[7rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
                  {tableCode}
                </span>
                <TierBadge className="hidden md:inline-flex" />
                <Link
                  href="/tab/cloak"
                  className={cn(
                    "lux-interactive lux-focus-ring relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/45 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 shadow-[0_0_16px_rgba(139,92,246,0.35)] transition hover:border-violet-400/70",
                    onCloak && "border-violet-400/80 bg-violet-500/25"
                  )}
                >
                  <Ghost className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                  <span className="hidden xs:inline sm:inline">Cloak Live</span>
                  <span className="relative flex h-1.5 w-1.5" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                </Link>
                <Link
                  href="/pass"
                  className={cn(
                    "lux-interactive lux-focus-ring inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                    theme.headerBadge
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline sm:inline">Pass</span>
                </Link>
              </div>
            </div>
            <GuestHeaderMenu />
          </header>

          <main className="relative mx-auto w-full max-w-6xl px-4 pb-40 pt-6">
            <PageEnter>{children}</PageEnter>
          </main>

          {showNav ? (
            <nav className="optimus-glass fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 backdrop-blur-2xl">
              <div className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
                {NAV.map((item) => {
                  const active =
                    item.href === "/tab"
                      ? pathname === "/tab" ||
                        (pathname.startsWith("/tab/") &&
                          !pathname.startsWith("/tab/cloak"))
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const isCloak = "cloak" in item && item.cloak;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "lux-interactive lux-focus-ring relative flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] transition-colors duration-lux ease-lux",
                        isCloak
                          ? active
                            ? "text-violet-100"
                            : "text-violet-300/90 hover:text-violet-100"
                          : active
                            ? theme.navActive
                            : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isCloak ? (
                        <span className="relative">
                          <span
                            className={cn(
                              "grid place-items-center rounded-full border border-violet-500/50 bg-violet-500/20 p-1 shadow-[0_0_14px_rgba(139,92,246,0.45)]",
                              active && "border-violet-300/80 bg-violet-500/35"
                            )}
                          >
                            <Icon className="h-4 w-4 text-violet-200" />
                          </span>
                          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                          </span>
                        </span>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : null}

          {showComplianceStrip ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-30 flex justify-center px-3 sm:bottom-[5.25rem]">
              <div className="pointer-events-auto max-w-full overflow-x-auto">
                <ResponsibleBadges density="micro" />
              </div>
            </div>
          ) : null}
        </div>
      </SaarthiProvider>
    </TierThemeProvider>
  );
}
