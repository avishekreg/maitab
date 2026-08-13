"use client";

import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { fetchClubOrders } from "@/lib/data/orders";
import { useOrdersRealtime } from "@/lib/hooks/use-orders-realtime";
import { useSessionStore } from "@/lib/store/session-store";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import { triggerHaptic } from "@/lib/utils";

export default function KdsPage() {
  const orders = useSessionStore((s) => s.orders);
  const markOrderReady = useSessionStore((s) => s.markOrderReady);
  const hydrateOrders = useSessionStore((s) => s.hydrateOrders);
  const patchOrder = useSessionStore((s) => s.patchOrder);

  useEffect(() => {
    void fetchClubOrders(NEON_CLUB_ID).then((live) => {
      if (live?.length) hydrateOrders(live);
    });
  }, [hydrateOrders]);

  const onOrderChange = useCallback(
    (patch: Parameters<typeof patchOrder>[0]) => {
      patchOrder(patch);
    },
    [patchOrder]
  );

  useOrdersRealtime(NEON_CLUB_ID, onOrderChange);

  const queue = orders.filter((order) =>
    ["PENDING", "PREPARING", "READY"].includes(order.status)
  );

  return (
    <div className="min-h-[100dvh] bg-nightlife-bg px-4 py-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MaiTabLogo variant="IconOnly" className="h-9 w-9" />
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                Bar KDS
              </h1>
              <p className="text-sm text-nightlife-muted">
                Mark Ready writes orders.status=READY · realtime to customer tab
              </p>
            </div>
          </div>
          <StatusPill label="BARTENDER" tone="gold" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queue.map((order, index) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <GlassPanel
                className="flex min-h-[220px] flex-col p-4"
                glow={order.status === "READY" ? "emerald" : "none"}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-3xl font-bold text-accent-gold">
                    #{order.token_number}
                  </p>
                  <StatusPill
                    label={order.status}
                    tone={order.status === "READY" ? "emerald" : "gold"}
                  />
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-lg">
                  {order.items.map((item) => (
                    <li
                      key={`${order.id}-${item.name}`}
                      className="font-medium text-white"
                    >
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
                {order.status !== "READY" ? (
                  <NeonButton
                    size="lg"
                    className="mt-4 w-full"
                    onClick={() => {
                      void markOrderReady(order.id);
                      void triggerHaptic(30);
                    }}
                  >
                    Mark Ready
                  </NeonButton>
                ) : (
                  <p className="mt-4 text-center text-sm text-accent-emerald">
                    Waiting for two-shelf pickup
                  </p>
                )}
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
