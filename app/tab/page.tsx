"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Minus, Plus } from "lucide-react";
import {
  ExternalDealApprovedModal,
  ExternalDealCard,
} from "@/components/discounts/ExternalDealCard";
import { AppShell } from "@/components/layout/AppShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierGlassCard, TierProgressRing } from "@/components/theme/TierChrome";
import { useTierTheme } from "@/components/theme/TierThemeProvider";
import { DEMO_CLUB, MENU_ITEMS } from "@/lib/demo/data";
import { fetchClubOrders } from "@/lib/data/orders";
import {
  discountedUnitPrice,
  sessionCanUseNativePromos,
  sessionHasApprovedExternalDeal,
} from "@/lib/discounts/bridge";
import {
  haversineMeters,
  shouldAutoSettle,
  type ExitTrackerSample,
} from "@/lib/geo/geofence";
import { useDiscountBridgeRealtime } from "@/lib/hooks/use-discount-bridge-realtime";
import { useLuckyDrawRealtime } from "@/lib/hooks/use-lucky-draw-realtime";
import { useOrdersRealtime } from "@/lib/hooks/use-orders-realtime";
import { useSessionStore } from "@/lib/store/session-store";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import type { OrderItem } from "@/lib/types";
import { cn, formatINR, triggerHaptic } from "@/lib/utils";

function TabBody() {
  const theme = useTierTheme();
  const session = useSessionStore((s) => s.session);
  const user = useSessionStore((s) => s.user);
  const orders = useSessionStore((s) => s.orders);
  const settleLockRef = useRef(false);
  const addOrderItems = useSessionStore((s) => s.addOrderItems);
  const markOrderDelivered = useSessionStore((s) => s.markOrderDelivered);
  const lastReadyToken = useSessionStore((s) => s.lastReadyToken);
  const setLastReadyToken = useSessionStore((s) => s.setLastReadyToken);
  const hydrateOrders = useSessionStore((s) => s.hydrateOrders);
  const patchOrder = useSessionStore((s) => s.patchOrder);
  const patchSession = useSessionStore((s) => s.patchSession);
  const applyLuckyDrawDiscount = useSessionStore((s) => s.applyLuckyDrawDiscount);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [buzz, setBuzz] = useState(false);
  const [geoNote, setGeoNote] = useState("Geo fence idle");
  const [luckyNote, setLuckyNote] = useState<string | null>(null);
  const [dealModal, setDealModal] = useState(false);
  const samplesRef = useRef<ExitTrackerSample[]>([]);
  const alertedTokens = useRef<Set<number>>(new Set());

  const externalActive = sessionHasApprovedExternalDeal(session);
  const discountPct = externalActive ? session.discount_percentage : 0;

  const priceFor = useCallback(
    (mrp: number) => discountedUnitPrice(mrp, discountPct),
    [discountPct]
  );

  const cart = useMemo(() => {
    return MENU_ITEMS.map((item) => ({
      ...item,
      quantity: qty[item.name] ?? 0,
      charge_price: priceFor(item.unit_price),
    })).filter((item) => item.quantity > 0);
  }, [qty, priceFor]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.charge_price * item.quantity,
    0
  );
  const cartMrp = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  useEffect(() => {
    void fetchClubOrders(NEON_CLUB_ID).then((live) => {
      if (live?.length) hydrateOrders(live);
    });
  }, [hydrateOrders]);

  const onOrderChange = useCallback(
    (patch: Parameters<typeof patchOrder>[0]) => {
      patchOrder(patch);
      if (
        patch.status === "READY" &&
        patch.token_number &&
        (!patch.session_id || patch.session_id === session.id) &&
        !alertedTokens.current.has(patch.token_number)
      ) {
        alertedTokens.current.add(patch.token_number);
        setLastReadyToken(patch.token_number);
      }
    },
    [patchOrder, session.id, setLastReadyToken]
  );

  useOrdersRealtime(NEON_CLUB_ID, onOrderChange);

  useLuckyDrawRealtime(NEON_CLUB_ID, (award) => {
    if (award.session_id !== session.id) return;
    if (!sessionCanUseNativePromos(session)) {
      setLuckyNote(
        "Lucky draw skipped — external deal exclusivity is active on this tab."
      );
      return;
    }
    applyLuckyDrawDiscount(award.discount_percent);
    setLuckyNote(`Lucky draw! ${award.discount_percent}% off your running tab.`);
    void triggerHaptic([40, 40, 80, 40, 120]);
  });

  useDiscountBridgeRealtime(NEON_CLUB_ID, (payload) => {
    if (payload.session_id !== session.id) return;
    patchSession({
      external_provider: payload.external_provider,
      external_voucher_code: payload.external_voucher_code,
      discount_percentage: payload.discount_percentage,
      discount_status: payload.discount_status,
      is_native_promos_eligible: payload.is_native_promos_eligible,
      discount_verified_by: payload.discount_verified_by,
      is_lucky_draw_eligible: payload.is_native_promos_eligible
        ? session.is_lucky_draw_eligible
        : false,
    });
    if (payload.discount_status === "APPROVED") {
      setDealModal(true);
      void triggerHaptic([40, 40, 80]);
    }
  });

  useEffect(() => {
    if (!lastReadyToken) return;
    setBuzz(true);
    void triggerHaptic([80, 40, 80, 40, 120]);
    const timer = setTimeout(() => {
      setBuzz(false);
      setLastReadyToken(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [lastReadyToken, setLastReadyToken]);

  useEffect(() => {
    if (!DEMO_CLUB.location || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const distance = haversineMeters(DEMO_CLUB.location!, { lat, lng });
        const sample = { distanceMeters: distance, at: Date.now() };
        samplesRef.current = [...samplesRef.current.slice(-40), sample];
        setGeoNote(`Distance ${Math.round(distance)}m from venue`);
        if (
          !settleLockRef.current &&
          shouldAutoSettle(samplesRef.current)
        ) {
          settleLockRef.current = true;
          setGeoNote("Exit fence sustained · invoking geo-auto-settle…");
          try {
            const res = await fetch("/api/payments/settle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mandateId: user.autopay_mandate_id ?? "",
                sessionId: session.id,
                amount: session.total_session_spend,
                lat,
                lng,
                distanceMeters: distance,
              }),
            });
            const result = (await res.json()) as {
              ok?: boolean;
              receiptId?: string;
              reason?: string;
              mode?: string;
              provider?: string;
            };
            setGeoNote(
              result.ok
                ? `Auto-settled via ${result.mode ?? result.provider ?? "pipeline"} · receipt ${result.receiptId}`
                : `Auto-settle failed · ${result.reason ?? res.status}`
            );
          } catch {
            settleLockRef.current = false;
            setGeoNote("Auto-settle network error — will retry");
          }
        }
      },
      () => setGeoNote("GPS permission needed for auto-settlement"),
      { enableHighAccuracy: true, maximumAge: 5_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [session.id, session.total_session_spend, user.autopay_mandate_id]);

  function bump(name: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[name] ?? 0) + delta);
      return { ...prev, [name]: next };
    });
  }

  async function placeOrder() {
    if (!cart.length) return;
    const items: OrderItem[] = cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.charge_price,
      category: item.category,
      notes: externalActive
        ? `MRP ${item.unit_price} · ${discountPct}% external deal`
        : undefined,
    }));
    await addOrderItems(items);
    setQty({});
    void triggerHaptic(30);
  }

  return (
    <>
      <AnimatePresence>
        {buzz ? (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-accent-emerald/40 bg-accent-emerald/10 px-4 py-3 text-accent-emerald"
          >
            <BellRing className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-semibold">Token #{lastReadyToken} ready</p>
              <p className="text-xs text-accent-emerald/80">
                Live KDS signal · two-shelf handover
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {luckyNote ? (
        <div className="mb-4 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
          {luckyNote}
        </div>
      ) : null}

      {!sessionCanUseNativePromos(session) ? (
        <div className="mb-4 rounded-2xl border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
          Native exclusivity lock: Hourly Lucky Draw and Flash Promos are
          disabled while the external deal is approved. Ordering, games, and
          AutoPay remain on.
        </div>
      ) : null}

      <ExternalDealCard />

      <TierGlassCard className="mb-5 p-4" showAura>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.accent }}
            >
              {theme.label}
              {theme.vip ? " · VIP" : ""} · Active session
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
              Prepaid Tab
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add drinks without PIN or OTP.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <TierProgressRing value={session.total_session_spend} max={5000} />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Session total</p>
              <p
                className="font-display text-2xl font-bold"
                style={{ color: theme.accent }}
              >
                {formatINR(session.total_session_spend)}
              </p>
            </div>
          </div>
        </div>
      </TierGlassCard>

      <p className="mb-4 text-xs text-muted-foreground">{geoNote}</p>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <TierGlassCard className="p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Menu
          </p>
          <div className="space-y-3">
            {MENU_ITEMS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} ·{" "}
                    {externalActive ? (
                      <>
                        <span className="mr-1.5 text-muted-foreground/70 line-through decoration-white/30">
                          {formatINR(item.unit_price)}
                        </span>
                        <span className="font-semibold text-accent-emerald">
                          {formatINR(priceFor(item.unit_price))}
                        </span>
                      </>
                    ) : (
                      formatINR(item.unit_price)
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bump(item.name, -1)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-secondary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center tabular-nums text-foreground">
                    {qty[item.name] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => bump(item.name, 1)}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg border",
                      theme.headerBadge
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Cart{" "}
              {externalActive && cartMrp !== cartTotal ? (
                <>
                  <span className="mr-1.5 line-through decoration-white/30">
                    {formatINR(cartMrp)}
                  </span>
                  <span className="font-semibold text-accent-emerald">
                    {formatINR(cartTotal)}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-accent-gold">
                  {formatINR(cartTotal)}
                </span>
              )}
            </p>
            <button
              type="button"
              disabled={!cart.length}
              onClick={() => void placeOrder()}
              className={cn(
                "inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold disabled:opacity-40",
                theme.button
              )}
            >
              Add to Tab
            </button>
          </div>
        </TierGlassCard>

        <TierGlassCard className="p-4" glow={false}>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Tickets
          </p>
          <div className="space-y-3">
            {orders
              .filter((order) => order.session_id === session.id)
              .map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-secondary p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      Token #{order.token_number}
                    </p>
                    <StatusPill
                      label={order.status}
                      tone={
                        order.status === "READY"
                          ? "emerald"
                          : order.status === "PREPARING"
                            ? "gold"
                            : "violet"
                      }
                    />
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {order.items.map((item) => {
                      const mrpMatch = item.notes?.match(/MRP\s+(\d+)/i);
                      const mrp = mrpMatch ? Number(mrpMatch[1]) : null;
                      return (
                        <li
                          key={`${order.id}-${item.name}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          {mrp && mrp > item.unit_price ? (
                            <span className="tabular-nums">
                              <span className="mr-1 line-through decoration-white/30">
                                {formatINR(mrp * item.quantity)}
                              </span>
                              <span className="text-accent-emerald">
                                {formatINR(item.unit_price * item.quantity)}
                              </span>
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-accent-gold">
                      {formatINR(order.total_amount)}
                    </p>
                    {order.status === "READY" ? (
                      <NeonButton
                        size="sm"
                        tone="ghost"
                        onClick={() => void markOrderDelivered(order.id)}
                      >
                        Collected
                      </NeonButton>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </TierGlassCard>
      </div>

      <ExternalDealApprovedModal
        open={dealModal}
        onClose={() => setDealModal(false)}
        session={session}
      />
    </>
  );
}

export default function TabPage() {
  return (
    <AppShell title="Bar Tab">
      <TabBody />
    </AppShell>
  );
}
