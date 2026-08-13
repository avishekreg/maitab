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
import type { Order, OrderItem, ActiveSession, UserProfile } from "@/lib/types";

interface SessionState {
  user: UserProfile;
  session: ActiveSession;
  orders: Order[];
  playedGameIds: string[];
  lastReadyToken: number | null;
  liveMode: boolean;
  hydrateOrders: (orders: Order[]) => void;
  hydratePlayedGames: (gameIds: string[]) => void;
  patchOrder: (patch: Partial<Order> & { id: string }) => void;
  addOrderItems: (items: OrderItem[]) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderDelivered: (orderId: string) => Promise<void>;
  markGamePlayed: (gameId: string) => void;
  applyLuckyDrawDiscount: (percent: number) => void;
  setLastReadyToken: (token: number | null) => void;
  setLiveMode: (live: boolean) => void;
  setSpendTier: (tier: UserProfile["global_spend_tier"]) => void;
}

function nextToken(orders: Order[]): number {
  const max = orders.reduce(
    (acc, order) => Math.max(acc, order.token_number),
    200
  );
  return max + 1;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: DEMO_CUSTOMER,
  session: DEMO_SESSION,
  orders: DEMO_ORDERS,
  playedGameIds: [],
  lastReadyToken: null,
  liveMode: false,

  setLiveMode: (live) => set({ liveMode: live }),

  hydrateOrders: (orders) => set({ orders }),

  hydratePlayedGames: (gameIds) =>
    set({ playedGameIds: Array.from(new Set(gameIds)) }),

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
    });

    if (live) {
      set((state) => ({
        orders: state.orders.some((o) => o.id === live.id)
          ? state.orders
          : [live, ...state.orders],
        session: {
          ...state.session,
          total_session_spend: state.session.total_session_spend + total,
          is_lucky_draw_eligible:
            state.session.total_session_spend + total >= 1500 &&
            !state.session.is_vip,
        },
      }));
      return;
    }

    const order: Order = {
      id: `o-${crypto.randomUUID()}`,
      session_id: get().session.id,
      club_id: get().session.club_id,
      items,
      total_amount: total,
      status: "PENDING",
      token_number: nextToken(get().orders),
      created_at: new Date().toISOString(),
      ready_at: null,
    };

    set((state) => ({
      orders: [order, ...state.orders],
      session: {
        ...state.session,
        total_session_spend: state.session.total_session_spend + total,
        is_lucky_draw_eligible:
          state.session.total_session_spend + total >= 1500 &&
          !state.session.is_vip,
      },
    }));
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

  markGamePlayed: (gameId) => {
    set((state) => ({
      playedGameIds: state.playedGameIds.includes(gameId)
        ? state.playedGameIds
        : [...state.playedGameIds, gameId],
    }));
  },

  applyLuckyDrawDiscount: (percent) => {
    set((state) => ({
      session: {
        ...state.session,
        total_session_spend: Math.round(
          state.session.total_session_spend * (1 - percent / 100)
        ),
        is_lucky_draw_eligible: false,
      },
    }));
  },

  setLastReadyToken: (token) => set({ lastReadyToken: token }),

  setSpendTier: (tier) =>
    set((state) => ({
      user: { ...state.user, global_spend_tier: tier },
    })),
}));
