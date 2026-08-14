"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { StatusPill } from "@/components/ui/StatusPill";
import { fetchClubOrders } from "@/lib/data/orders";
import { useOrdersRealtime } from "@/lib/hooks/use-orders-realtime";
import { formatPickupRouteLine } from "@/lib/kds/routing";
import { formatTokenDisplay } from "@/lib/kds/token";
import { useSessionStore } from "@/lib/store/session-store";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import {
  DEMO_WAITER_SHIFTS,
  DEMO_CLUB_ZONES,
} from "@/lib/waiter/allocation";

/**
 * Waiter companion — zone-routed digital token cards for floor handshake.
 * Orders auto-route by club zone; only this waiter's tickets appear.
 */
export default function WaiterCompanionPage() {
  const orders = useSessionStore((s) => s.orders);
  const hydrateOrders = useSessionStore((s) => s.hydrateOrders);
  const patchOrder = useSessionStore((s) => s.patchOrder);
  const [waiterId, setWaiterId] = useState(DEMO_WAITER_SHIFTS[0]!.waiter_id);

  useEffect(() => {
    void fetchClubOrders(NEON_CLUB_ID).then((live) => {
      if (live?.length) hydrateOrders(live);
    });
  }, [hydrateOrders]);

  useOrdersRealtime(NEON_CLUB_ID, (patch) => patchOrder(patch));

  const shift = DEMO_WAITER_SHIFTS.find((s) => s.waiter_id === waiterId);
  const zone = DEMO_CLUB_ZONES.find((z) => z.id === shift?.assigned_zone_id);

  const mine = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.assigned_waiter_id === waiterId &&
          ["PENDING", "PREPARING", "READY"].includes(o.status)
      ),
    [orders, waiterId]
  );

  const ready = mine.filter((o) => o.status === "READY");
  const inBar = mine.filter((o) => o.status !== "READY");

  return (
    <div className="min-h-[100dvh] bg-[#0B0E14] px-4 py-6 text-[#F8FAFC]">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-3">
          <BrandLockup />
          <StatusPill label="WAITER" tone="violet" />
        </div>

        <h1 className="font-display text-3xl font-bold text-white">
          Zone Token Cards
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[#E2E8F0]">
          Auto-routed from your zone. Show the bold pickup token to the
          bartender — they single-tap the matching code on KDS.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {DEMO_WAITER_SHIFTS.map((s) => {
            const z = DEMO_CLUB_ZONES.find((x) => x.id === s.assigned_zone_id);
            const active = s.waiter_id === waiterId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setWaiterId(s.waiter_id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  active
                    ? "border-[#E2B857] bg-[#E2B857]/15 text-[#E2B857]"
                    : "border-white/15 text-[#E2E8F0]/80 hover:border-white/30"
                }`}
              >
                <span className="block font-semibold">{s.waiter_name}</span>
                <span className="text-[11px] opacity-80">
                  {z?.zone_name ?? "Unassigned"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#E2E8F0]/85">
          <span className="font-semibold text-white">
            {shift?.waiter_name}
          </span>{" "}
          · {zone?.zone_name ?? "—"} ·{" "}
          {zone?.zone_name === "VIP Lounge" ? "V1–V3" : "B1–B10"}
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E2B857]/90">
            Ready for handshake ({ready.length})
          </p>
          {ready.length === 0 ? (
            <GlassPanel className="p-6">
              <p className="text-center text-[#E2E8F0]/80">
                No READY tickets in your zone yet.
              </p>
            </GlassPanel>
          ) : (
            ready.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="rounded-3xl border-2 border-[#E2B857]/70 bg-gradient-to-b from-[#1a1520] to-[#0f1117] p-8 text-center shadow-[0_0_48px_rgba(226,184,87,0.28)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E2B857]/90">
                    Pickup token · {zone?.zone_name}
                  </p>
                  <p className="mt-3 font-display text-7xl font-extrabold tracking-tight text-[#E2B857] drop-shadow-[0_0_28px_rgba(226,184,87,0.55)] sm:text-8xl">
                    {order.pickup_token_code ??
                      formatTokenDisplay(order.token_number)}
                  </p>
                  <p className="mt-4 rounded-xl border border-[#E2B857]/35 bg-[#E2B857]/10 px-3 py-2 font-mono text-sm font-semibold uppercase tracking-wide text-[#E2B857] sm:text-base">
                    {formatPickupRouteLine(
                      order.pickup_token_code ??
                        formatTokenDisplay(order.token_number),
                      order.assigned_counter_name
                    )}
                  </p>
                  <ul className="mt-6 space-y-1 text-lg text-[#F8FAFC]">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.name}`}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-[#E2E8F0]/70">
                    Routed to {order.assigned_waiter_name ?? shift?.waiter_name}
                  </p>
                </div>
              </motion.div>
            ))
          )}

          {inBar.length ? (
            <div className="pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                In bar queue ({inBar.length})
              </p>
              <div className="space-y-2">
                {inBar.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <span className="font-mono font-semibold text-[#E2B857]">
                      {order.pickup_token_code ??
                        formatTokenDisplay(order.token_number)}
                    </span>
                    <span className="max-w-[50%] truncate text-right text-[11px] text-[#E2E8F0]/75">
                      {order.assigned_counter_name ?? order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
