"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import type { DiscountBridgePayload } from "@/lib/data/discounts";
import { fetchClubOrders } from "@/lib/data/orders";
import { providerLabel } from "@/lib/discounts/bridge";
import { useDiscountBridgeRealtime } from "@/lib/hooks/use-discount-bridge-realtime";
import { useOrdersRealtime } from "@/lib/hooks/use-orders-realtime";
import { publishBus } from "@/lib/realtime/bus";
import { useSessionStore } from "@/lib/store/session-store";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import type { ActiveSession } from "@/lib/types";
import { triggerHaptic } from "@/lib/utils";

type PendingDeal = DiscountBridgePayload & { seenAt: number };

export default function KdsPage() {
  const orders = useSessionStore((s) => s.orders);
  const markOrderReady = useSessionStore((s) => s.markOrderReady);
  const hydrateOrders = useSessionStore((s) => s.hydrateOrders);
  const patchOrder = useSessionStore((s) => s.patchOrder);
  const [pendingDeals, setPendingDeals] = useState<PendingDeal[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void fetchClubOrders(NEON_CLUB_ID).then((live) => {
      if (live?.length) hydrateOrders(live);
    });
  }, [hydrateOrders]);

  useEffect(() => {
    void fetch(`/api/discounts/pending?clubId=${NEON_CLUB_ID}`)
      .then((r) => r.json())
      .then((data: { sessions?: ActiveSession[] }) => {
        if (!data.sessions?.length) return;
        setPendingDeals(
          data.sessions.map((s) => ({
            session_id: s.id,
            club_id: s.club_id,
            external_provider: s.external_provider,
            external_voucher_code: s.external_voucher_code,
            discount_percentage: s.discount_percentage,
            discount_status: s.discount_status,
            is_native_promos_eligible: s.is_native_promos_eligible,
            discount_verified_by: s.discount_verified_by,
            table_hint: "Tab",
            seenAt: Date.now(),
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  const onOrderChange = useCallback(
    (patch: Parameters<typeof patchOrder>[0]) => {
      patchOrder(patch);
    },
    [patchOrder]
  );

  useOrdersRealtime(NEON_CLUB_ID, onOrderChange);

  useDiscountBridgeRealtime(NEON_CLUB_ID, (payload, event) => {
    if (payload.discount_status === "PENDING_VERIFICATION") {
      setPendingDeals((prev) => {
        const without = prev.filter((p) => p.session_id !== payload.session_id);
        return [{ ...payload, seenAt: Date.now() }, ...without];
      });
      setToast(
        `External deal request · ${providerLabel(payload.external_provider)} ${payload.discount_percentage}%`
      );
      void triggerHaptic([40, 30, 40]);
      window.setTimeout(() => setToast(null), 4500);
      return;
    }

    if (
      payload.discount_status === "APPROVED" ||
      payload.discount_status === "REJECTED" ||
      event === "APPROVED"
    ) {
      setPendingDeals((prev) =>
        prev.filter((p) => p.session_id !== payload.session_id)
      );
    }
  });

  async function act(
    deal: PendingDeal,
    action: "approve" | "reject"
  ) {
    setBusyId(deal.session_id);
    try {
      const fallbackSession: ActiveSession = {
        id: deal.session_id,
        user_id: "",
        club_id: deal.club_id,
        primary_table_id: "",
        total_session_spend: 0,
        is_lucky_draw_eligible: false,
        is_vip: false,
        status: "ACTIVE",
        started_at: new Date().toISOString(),
        ended_at: null,
        external_provider: deal.external_provider,
        external_voucher_code: deal.external_voucher_code,
        discount_percentage: deal.discount_percentage,
        discount_status: "PENDING_VERIFICATION",
        discount_verified_by: null,
        is_native_promos_eligible: true,
      };

      const res = await fetch("/api/discounts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: deal.session_id,
          action,
          discountPercentage: deal.discount_percentage,
          fallbackSession,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        bridge?: DiscountBridgePayload;
        session?: ActiveSession;
      };
      if (!data.ok || !data.bridge) {
        setToast(data.reason ?? "Action failed");
        return;
      }
      publishBus(
        "discount_bridge",
        action === "approve" ? "APPROVED" : "REJECTED",
        data.bridge
      );
      setPendingDeals((prev) =>
        prev.filter((p) => p.session_id !== deal.session_id)
      );
      setToast(
        action === "approve"
          ? `${providerLabel(deal.external_provider)} locked · native promos off`
          : "External deal rejected · native promos restored"
      );
      void triggerHaptic(30);
    } finally {
      setBusyId(null);
    }
  }

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
                Mark Ready · verify external deals · realtime to guest tab
              </p>
            </div>
          </div>
          <StatusPill label="BARTENDER" tone="gold" />
        </div>

        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className="mb-4 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold"
            >
              {toast}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {pendingDeals.length ? (
          <div className="mb-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-nightlife-muted">
              External deal verification
            </p>
            {pendingDeals.map((deal) => (
              <GlassPanel
                key={deal.session_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                glow="gold"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-white">
                    {providerLabel(deal.external_provider)}{" "}
                    {deal.discount_percentage}% · pending
                  </p>
                  <p className="mt-1 text-sm text-nightlife-muted">
                    Code{" "}
                    <span className="font-mono text-accent-gold">
                      {deal.external_voucher_code}
                    </span>
                    {deal.table_hint ? ` · ${deal.table_hint}` : null}
                  </p>
                  <p className="mt-1 text-xs text-nightlife-muted">
                    Approve locks native flash promos + lucky draw for this
                    session.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <NeonButton
                    size="sm"
                    tone="ghost"
                    disabled={busyId === deal.session_id}
                    onClick={() => void act(deal, "reject")}
                  >
                    Reject
                  </NeonButton>
                  <NeonButton
                    size="sm"
                    disabled={busyId === deal.session_id}
                    onClick={() => void act(deal, "approve")}
                  >
                    Approve &amp; Lock Deal
                  </NeonButton>
                </div>
              </GlassPanel>
            ))}
          </div>
        ) : null}

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
