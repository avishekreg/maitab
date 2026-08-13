"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, ChevronRight, MapPin, Sparkles, Vibrate } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierGlassCard, TierProgressRing } from "@/components/theme/TierChrome";
import { useTierTheme } from "@/components/theme/TierThemeProvider";
import { DEMO_CLUB, DEMO_TABLES } from "@/lib/demo/data";
import { useSessionStore } from "@/lib/store/session-store";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Guest";
}

function HomeBody() {
  const theme = useTierTheme();
  const user = useSessionStore((s) => s.user);
  const session = useSessionStore((s) => s.session);
  const orders = useSessionStore((s) => s.orders);
  const primary = DEMO_TABLES.find((t) => t.id === session.primary_table_id);
  const guestFirst = firstName(user.full_name);

  return (
    <>
      <section className="relative -mx-4 mb-8 overflow-hidden px-4 pb-2 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative flex min-h-[36vh] flex-col justify-end"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="max-w-md text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Hello, {guestFirst} 👋
            </h1>
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: "#E2B857",
                borderColor: "rgba(226,184,87,0.65)",
                background:
                  "linear-gradient(135deg, rgba(226,184,87,0.18), rgba(226,184,87,0.05))",
                boxShadow: "0 0 20px rgba(226,184,87,0.22)",
              }}
            >
              {user.global_spend_tier} Tier Member
            </span>
          </div>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Your night at {DEMO_CLUB.name} is active. Scan, order, settle on
            exit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tab"
              className={cn(
                "inline-flex h-14 items-center justify-center rounded-xl px-6 text-base font-semibold",
                theme.button
              )}
            >
              Open Tab
            </Link>
            <Link href="/game">
              <NeonButton size="lg" tone="ghost">
                Surprise Game
              </NeonButton>
            </Link>
          </div>
        </motion.div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <TierGlassCard className="p-5" showAura>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Active session
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
                {DEMO_CLUB.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Table {primary?.table_code ?? "—"} · Host {user.full_name}
              </p>
            </div>
            <TierProgressRing value={session.total_session_spend} max={5000} />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Running tab</p>
              <p
                className="font-display text-4xl font-bold"
                style={{ color: theme.accent }}
              >
                {formatINR(session.total_session_spend)}
              </p>
            </div>
            <div className="text-right">
              <StatusPill
                label={
                  session.is_lucky_draw_eligible
                    ? "Lucky draw ready"
                    : "In session"
                }
                tone={session.is_lucky_draw_eligible ? "gold" : "emerald"}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {orders.filter((o) => o.status !== "DELIVERED" && o.status !== "RELEASED").length}{" "}
                open tickets
              </p>
            </div>
          </div>
        </TierGlassCard>

        <TierGlassCard className="p-5" glow={false}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Device permissions
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3 text-foreground/80">
              <Camera className="h-4 w-4" style={{ color: theme.accent }} />
              Camera · table QR scan
            </li>
            <li className="flex items-center gap-3 text-foreground/80">
              <MapPin
                className="h-4 w-4"
                style={{ color: theme.accentSecondary }}
              />
              GPS · 50m auto-debit fence
            </li>
            <li className="flex items-center gap-3 text-foreground/80">
              <Vibrate className="h-4 w-4 text-accent-emerald" />
              Haptics · ready alerts
            </li>
          </ul>
          <Link
            href="/pass"
            className="mt-5 inline-flex items-center gap-1 text-sm"
            style={{ color: theme.accent }}
          >
            Show Member Pass <ChevronRight className="h-4 w-4" />
          </Link>
        </TierGlassCard>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: theme.accent }} />
          <h3 className="type-title text-lg text-foreground">Quick moves</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/tab", title: "Add to Tab", copy: "Prepaid, no re-auth." },
            {
              href: "/game",
              title: "Surprise Me",
              copy: "Animated table games.",
            },
            {
              href: "/pass",
              title: "Gate Pass",
              copy: "Tier hospitality ready.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link href={item.href} className="block">
                <TierGlassCard className="h-full p-4" glow={false}>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.copy}
                  </p>
                </TierGlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function CustomerHomePage() {
  return (
    <AppShell title="Tonight">
      <HomeBody />
    </AppShell>
  );
}
