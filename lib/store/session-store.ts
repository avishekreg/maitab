"use client";

import { create } from "zustand";
import {
  DEMO_CUSTOMER,
  DEMO_ORDERS,
  DEMO_SESSION,
} from "@/lib/demo/data";
import {
  createOrderLive,
  markOrderDeliveredLive,
  markOrderReadyLive,
} from "@/lib/data/orders";
import { formatTokenDisplay, generateOrderTokenCode } from "@/lib/kds/token";
import { sessionCanUseNativePromos } from "@/lib/discounts/bridge";
import type { Order, OrderItem, ActiveSession, UserProfile } from "@/lib/types";
import { resolveBarCounterForTableId } from "@/lib/kds/routing";
import { resolveWaiterForTableId } from "@/lib/waiter/allocation";

interface SessionState {
  user: UserProfile;
  session: ActiveSession;
  orders: Order[];
  playedGameIds: string[];
  lastReadyToken: number | null;
  liveMode: boolean;
  /** Live venue header from nightly attachment (Layer 2). */
  venue: {
    club_id: string;
    club_name: string;
    table_id: string;
    table_code: string;
  } | null;
  hydrateGuestShell: (payload: {
    user: UserProfile;
    session: ActiveSession | null;
    orders?: Order[];
    venue?: SessionState["venue"];
  }) => void;
  hydrateOrders: (orders: Order[]) => void;
  hydratePlayedGames: (gameIds: string[]) => void;
  patchOrder: (patch: Partial<Order> & { id: string }) => void;
  patchSession: (patch: Partial<ActiveSession>) => void;
  addOrderItems: (items: OrderItem[]) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderDelivered: (orderId: string) => Promise<void>;
  releaseOrderHandshake: (orderId: string) => Promise<void>;
  markGamePlayed: (gameId: string) => void;
  applyLuckyDrawDiscount: (percent: number) => void;
  setLastReadyToken: (token: number | null) => void;
  setLiveMode: (live: boolean) => void;
  setSpendTier: (tier: UserProfile["global_spend_tier"]) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: DEMO_CUSTOMER,
  session: DEMO_SESSION,
  orders: DEMO_ORDERS,
  playedGameIds: [],
  lastReadyToken: null,
  liveMode: false,
  venue: {
    club_id: DEMO_SESSION.club_id,
    club_name: "Neon District",
    table_id: DEMO_SESSION.primary_table_id,
    table_code: "B4",
  },

  hydrateGuestShell: (payload) =>
    set((state) => ({
      user: payload.user,
      session: payload.session ?? state.session,
      orders: payload.orders ?? state.orders,
      venue: payload.venue ?? state.venue,
      liveMode: true,
    })),

  setLiveMode: (live) => set({ liveMode: live }),

  hydrateOrders: (orders) => set({ orders }),

  hydratePlayedGames: (gameIds) =>
    set({ playedGameIds: Array.from(new Set(gameIds)) }),

  patchSession: (patch) =>
    set((state) => ({
      session: { ...state.session, ...patch },
    })),

  patchOrder: (patch) => {
    set((state) => {
      const exists = state.orders.some((order) => order.id === patch.id);
      const orders = exists
        ? state.orders.map((order) =>
            order.id === patch.id ? { ...order, ...patch } : order
          )
        : patch.token_number
          ? ([patch as Order, ...state.orders] as Order[])
          : state.orders;

      const readyToken =
        patch.status === "READY" && patch.token_number
          ? patch.token_number
          : patch.status === "READY"
            ? orders.find((o) => o.id === patch.id)?.token_number ??
              state.lastReadyToken
            : state.lastReadyToken;

      return {
        orders,
        lastReadyToken:
          patch.status === "READY" ? readyToken : state.lastReadyToken,
      };
    });
  },

  addOrderItems: async (items) => {
    const total = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const live = await createOrderLive({
      sessionId: get().session.id,
      clubId: get().session.club_id,
      items,
      primaryTableId: get().session.primary_table_id,
    });

    if (live) {
      set((state) => {
        const spend = state.session.total_session_spend + total;
        const nativeOk = sessionCanUseNativePromos(state.session);
        return {
          orders: state.orders.some((o) => o.id === live.id)
            ? state.orders
            : [live, ...state.orders],
          session: {
            ...state.session,
            total_session_spend: spend,
            is_lucky_draw_eligible:
              nativeOk && spend >= 1500 && !state.session.is_vip,
          },
        };
      });
      return;
    }

    const token_number = generateOrderTokenCode(
      get().orders.map((o) => o.token_number)
    );
    const route = resolveWaiterForTableId(
      get().session.primary_table_id,
      token_number,
      get().session.club_id
    );
    const bar = resolveBarCounterForTableId(
      get().session.primary_table_id,
      get().session.club_id
    );

    const order: Order = {
      id: `o-${crypto.randomUUID()}`,
      session_id: get().session.id,
      club_id: get().session.club_id,
      items,
      total_amount: total,
      status: "PENDING",
      token_number,
      created_at: new Date().toISOString(),
      ready_at: null,
      assigned_waiter_id: route?.assigned_waiter_id ?? null,
      assigned_waiter_name: route?.assigned_waiter_name ?? null,
      pickup_token_code:
        route?.pickup_token_code ?? formatTokenDisplay(token_number),
      assigned_counter_id: bar?.assigned_counter_id ?? null,
      assigned_counter_name: bar?.assigned_counter_name ?? null,
    };

    set((state) => {
      const spend = state.session.total_session_spend + total;
      const nativeOk = sessionCanUseNativePromos(state.session);
      return {
        orders: [order, ...state.orders],
        session: {
          ...state.session,
          total_session_spend: spend,
          is_lucky_draw_eligible:
            nativeOk && spend >= 1500 && !state.session.is_vip,
        },
      };
    });
  },

  markOrderReady: async (orderId) => {
    const current = get().orders.find((order) => order.id === orderId);
    set((state) => {
      const orders = state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "READY" as const,
              ready_at: new Date().toISOString(),
            }
          : order
      );
      const ready = orders.find((order) => order.id === orderId);
      return {
        orders,
        lastReadyToken: ready?.token_number ?? state.lastReadyToken,
      };
    });

    const live = await markOrderReadyLive(orderId);
    if (live) {
      get().patchOrder(live);
    } else if (current) {
      // Ensure bus carries token for customer haptic in fallback mode.
      const { publishBus } = await import("@/lib/realtime/bus");
      publishBus("orders", "UPDATE", {
        id: orderId,
        status: "READY",
        token_number: current.token_number,
        session_id: current.session_id,
        ready_at: new Date().toISOString(),
      });
    }
  },

  markOrderDelivered: async (orderId) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: "DELIVERED" as const }
          : order
      ),
    }));
    await markOrderDeliveredLive(orderId);
  },

  releaseOrderHandshake: async (orderId) => {
    const current = get().orders.find((order) => order.id === orderId);
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: "RELEASED" as const }
          : order
      ),
    }));

    try {
      await fetch("/api/orders/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          tokenNumber: current?.token_number,
          tableId: get().session.primary_table_id,
          deviceFingerprint: "kds-floor",
        }),
      });
    } catch {
      // local status already updated
    }

    if (current) {
      const { publishBus } = await import("@/lib/realtime/bus");
      publishBus("orders", "UPDATE", {
        id: orderId,
        status: "RELEASED",
        token_number: current.token_number,
        session_id: current.session_id,
      });
    }
  },

  markGamePlayed: (gameId) => {
    set((state) => ({
      playedGameIds: state.playedGameIds.includes(gameId)
        ? state.playedGameIds
        : [...state.playedGameIds, gameId],
    }));
  },

  applyLuckyDrawDiscount: (percent) => {
    set((state) => {
      if (!sessionCanUseNativePromos(state.session)) {
        return state;
      }
      return {
        session: {
          ...state.session,
          total_session_spend: Math.round(
            state.session.total_session_spend * (1 - percent / 100)
          ),
          is_lucky_draw_eligible: false,
        },
      };
    });
  },

  setLastReadyToken: (token) => set({ lastReadyToken: token }),

  setSpendTier: (tier) =>
    set((state) => ({
      user: { ...state.user, global_spend_tier: tier },
    })),
}));
