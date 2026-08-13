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
      <TierGlassCard className="overflow-hidden p-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-nightlife-muted">
                mAITab Network
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-white">
                {user.full_name}
              </h1>
            </div>
            <div
              className="grid h-12 w-12 place-items-center rounded-full border text-sm font-bold"
              style={{
                borderColor: `${theme.accent}66`,
                color: theme.accent,
                background: `${theme.accent}18`,
              }}
            >
              {initials(user.full_name)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: `${theme.accent}66`,
                color: theme.accent,
                background: `${theme.accent}18`,
              }}
            >
              {theme.label} · {theme.badge}
            </span>
            <StatusPill
              label={`AutoPay ${user.autopay_status}`}
              tone={user.autopay_status === "ACTIVE" ? "emerald" : "ruby"}
            />
            <StatusPill label={`${user.lifetime_visits} visits`} tone="muted" />
          </div>

          <div className="mt-6 grid place-items-center rounded-2xl bg-white p-4">
            {token ? (
              <MemberPassQR value={token} />
            ) : (
              <p className="text-sm text-nightlife-bg/70">
                {tokenError ?? "Minting signed pass…"}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-nightlife-muted">
            HMAC-signed Member Pass · gate-scannable QR
          </p>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-nightlife-muted">
              Favorite drinks
            </p>
            <ul className="mt-2 space-y-2">
              {user.favorite_drinks.map((drink) => (
                <li
                  key={drink.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">{drink.name}</span>
                  <span className="text-nightlife-muted">
                    {drink.times_ordered ?? 0}× lifetime
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TierGlassCard>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-nightlife-muted">
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
                    ? "border-current bg-white/10"
                    : "border-white/10 text-nightlife-muted"
                }`}
                style={
                  active
                    ? {
                        color: theme.accent,
                        borderColor: `${theme.accent}88`,
                      }
                    : undefined
                }
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-nightlife-muted">
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
