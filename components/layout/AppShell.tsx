"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, QrCode, Receipt, Sparkles, Ticket } from "lucide-react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { TierBadge } from "@/components/theme/TierChrome";
import { TierThemeProvider } from "@/components/theme/TierThemeProvider";
import { useSessionStore } from "@/lib/store/session-store";
import { getTierTheme } from "@/lib/theme/tiers";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home", icon: Sparkles },
  { href: "/tab", label: "Tab", icon: Receipt },
  { href: "/game", label: "Game", icon: Gamepad2 },
  { href: "/pass", label: "Pass", icon: Ticket },
];

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
  title?: string;
}

export function AppShell({ children, showNav = true, title }: AppShellProps) {
  const pathname = usePathname();
  const tier = useSessionStore((s) => s.user.global_spend_tier);
  const theme = getTierTheme(tier);

  return (
    <TierThemeProvider tier={tier}>
      <div className="relative min-h-[100dvh] bg-background text-foreground">
        <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />

        <header className="optimus-glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
            <Link href="/home" className="flex min-w-0 items-center gap-3">
              <MaiTabLogo variant="FullLogoWithText" className="h-8 w-auto" />
              {title ? (
                <p className="hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  {title}
                </p>
              ) : null}
            </Link>
            <div className="flex min-w-0 items-center gap-2">
              <TierBadge className="hidden sm:inline-flex" />
              <Link
                href="/pass"
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  theme.headerBadge
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">Pass</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6">
          {children}
        </main>

        {showNav ? (
          <nav className="optimus-glass fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0">
            <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] transition",
                      active
                        ? theme.navActive
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </TierThemeProvider>
  );
}
