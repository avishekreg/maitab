"use client";

import { useEffect, useState } from "react";
import { MemberPassQR } from "@/components/pass/MemberPassQR";
import { AppShell } from "@/components/layout/AppShell";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierGlassCard } from "@/components/theme/TierChrome";
import { useTierTheme } from "@/components/theme/TierThemeProvider";
import { useSessionStore } from "@/lib/store/session-store";
import type { SpendTier } from "@/lib/types";
import { initials } from "@/lib/utils";

const TIERS: SpendTier[] = ["BRONZE", "SILVER", "GOLD", "TITAN"];

function PassBody() {
  const theme = useTierTheme();
  const user = useSessionStore((s) => s.user);
  const setSpendTier = useSessionStore((s) => s.setSpendTier);
  const [token, setToken] = useState<string>("");
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      userId: user.id,
      name: user.full_name,
      tier: user.global_spend_tier,
      visits: String(user.lifetime_visits),
    });
    if (user.autopay_mandate_id) {
      params.set("mandate", user.autopay_mandate_id);
    }

    void fetch(`/api/pass/token?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { ok?: boolean; token?: string; reason?: string }) => {
        if (data.ok && data.token) {
          setToken(data.token);
          setTokenError(null);
        } else {
          setTokenError(data.reason ?? "Could not mint pass token");
        }
      })
      .catch(() => setTokenError("Could not mint pass token"));
  }, [
    user.id,
    user.full_name,
    user.global_spend_tier,
    user.autopay_mandate_id,
    user.lifetime_visits,
  ]);

  return (
    <div className="mx-auto max-w-md">
      <TierGlassCard className="overflow-hidden p-0" showAura>
        {/* Tier status strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentSecondary})`,
          }}
        />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                mAITab Network · Member Pass
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
                {user.full_name}
              </h1>
            </div>
            <div
              className="grid h-12 w-12 place-items-center rounded-full border text-sm font-bold"
              style={{
                borderColor: `${theme.accent}99`,
                color: theme.accent,
                background: `${theme.accent}18`,
                boxShadow: `0 0 20px ${theme.accent}33`,
              }}
            >
              {initials(user.full_name)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{
                borderColor: `${theme.accent}99`,
                color: theme.accent,
                background: `${theme.accent}14`,
                boxShadow: `0 0 16px ${theme.accent}22`,
              }}
            >
              {theme.label}
              {theme.vip ? " · VIP" : ""} · {theme.badge}
            </span>
            <StatusPill
              label={`AutoPay ${user.autopay_status}`}
              tone={user.autopay_status === "ACTIVE" ? "emerald" : "ruby"}
            />
            <StatusPill label={`${user.lifetime_visits} visits`} tone="muted" />
          </div>

          <div
            className="mt-6 grid place-items-center rounded-2xl border bg-white p-4"
            style={{
              borderColor: `${theme.accent}55`,
              boxShadow: `inset 0 0 0 1px ${theme.accent}22, 0 8px 24px ${theme.accent}18`,
            }}
          >
            {token ? (
              <MemberPassQR value={token} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {tokenError ?? "Minting signed pass…"}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            HMAC-signed Member Pass · gate-scannable QR
          </p>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Favorite drinks
            </p>
            <ul className="mt-2 space-y-2">
              {user.favorite_drinks.map((drink) => (
                <li
                  key={drink.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{drink.name}</span>
                  <span className="text-muted-foreground">
                    {drink.times_ordered ?? 0}× lifetime
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TierGlassCard>

      <div className="optimus-glass mt-4 rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Preview tier aesthetic
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TIERS.map((tier) => {
            const active = user.global_spend_tier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSpendTier(tier)}
                className={`rounded-xl border px-2 py-2 text-[11px] font-semibold uppercase transition ${
                  active
                    ? "bg-white/60"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
                style={
                  active
                    ? {
                        color: theme.accent,
                        borderColor: theme.accent,
                        boxShadow: `0 0 16px ${theme.accent}33`,
                      }
                    : undefined
                }
              >
                {tier === "TITAN" ? "VIP" : tier}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Present at gate for hospitality scan + micro-hold verification.
      </p>
    </div>
  );
}

export default function MemberPassPage() {
  return (
    <AppShell title="Member Pass">
      <PassBody />
    </AppShell>
  );
}
