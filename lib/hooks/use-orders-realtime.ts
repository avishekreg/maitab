"use client";

import { useEffect } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { subscribeBus } from "@/lib/realtime/bus";

type OrderPatch = Partial<Order> & { id: string };

export function useOrdersRealtime(
  clubId: string,
  onChange: (patch: OrderPatch) => void
) {
  useEffect(() => {
    const unsubBus = subscribeBus("orders", (envelope) => {
      onChange(envelope.payload as OrderPatch);
    });

    if (!isSupabaseConfigured()) {
      return () => unsubBus();
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => unsubBus();
    }

    const channel = supabase
      .channel(`orders-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown>;
          if (!row?.id) return;
          onChange({
            id: String(row.id),
            session_id: row.session_id ? String(row.session_id) : undefined,
            club_id: row.club_id ? String(row.club_id) : undefined,
            items: row.items as Order["items"] | undefined,
            total_amount:
              row.total_amount !== undefined
                ? Number(row.total_amount)
                : undefined,
            status: row.status as OrderStatus | undefined,
            token_number:
              row.token_number !== undefined
                ? Number(row.token_number)
                : undefined,
            created_at: row.created_at ? String(row.created_at) : undefined,
            ready_at: row.ready_at ? String(row.ready_at) : null,
          });
        }
      )
      .subscribe();

    return () => {
      unsubBus();
      void supabase.removeChannel(channel);
    };
  }, [clubId, onChange]);
}
