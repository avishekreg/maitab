"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

/**
 * Subscribes to order status changes for a club when Supabase is configured.
 */
export function useRealtimeOrders(
  clubId: string | null,
  onChange: (order: Order) => void
) {
  useEffect(() => {
    if (!clubId) return;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`orders-club-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            onChange(payload.new as Order);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clubId, onChange]);
}
