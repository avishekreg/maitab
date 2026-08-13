"use client";

import { useEffect } from "react";
import type { DiscountBridgePayload } from "@/lib/data/discounts";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { subscribeBus } from "@/lib/realtime/bus";

export function useDiscountBridgeRealtime(
  clubId: string,
  onEvent: (payload: DiscountBridgePayload, event: string) => void
) {
  useEffect(() => {
    const unsubBus = subscribeBus("discount_bridge", (envelope) => {
      const payload = envelope.payload as DiscountBridgePayload;
      if (payload.club_id && payload.club_id !== clubId) return;
      onEvent(payload, envelope.event);
    });

    if (!isSupabaseConfigured()) {
      return () => unsubBus();
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => unsubBus();
    }

    const channel = supabase
      .channel(`discount-bridge-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "active_sessions",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (
            row.discount_status !== "PENDING_VERIFICATION" &&
            row.discount_status !== "APPROVED" &&
            row.discount_status !== "REJECTED"
          ) {
            return;
          }
          onEvent(
            {
              session_id: String(row.id),
              club_id: String(row.club_id),
              external_provider: row.external_provider as DiscountBridgePayload["external_provider"],
              external_voucher_code: row.external_voucher_code
                ? String(row.external_voucher_code)
                : null,
              discount_percentage: Number(row.discount_percentage ?? 0),
              discount_status:
                (row.discount_status as DiscountBridgePayload["discount_status"]) ??
                null,
              is_native_promos_eligible: Boolean(
                row.is_native_promos_eligible ?? true
              ),
              discount_verified_by: row.discount_verified_by
                ? String(row.discount_verified_by)
                : null,
            },
            "UPDATE"
          );
        }
      )
      .subscribe();

    return () => {
      unsubBus();
      void supabase.removeChannel(channel);
    };
  }, [clubId, onEvent]);
}
