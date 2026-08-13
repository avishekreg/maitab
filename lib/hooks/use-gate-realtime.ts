"use client";

import { useEffect } from "react";
import type { GateEntryEvent } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { subscribeBus } from "@/lib/realtime/bus";

export function useGateRealtime(
  clubId: string,
  onEvent: (event: GateEntryEvent) => void
) {
  useEffect(() => {
    const unsubBus = subscribeBus("gate_entry_events", (envelope) => {
      onEvent(envelope.payload as GateEntryEvent);
    });

    if (!isSupabaseConfigured()) {
      return () => unsubBus();
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => unsubBus();
    }

    const channel = supabase
      .channel(`gate-entries-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gate_entry_events",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onEvent({
            id: String(row.id),
            club_id: String(row.club_id),
            user_id: String(row.user_id),
            guest_name: String(row.guest_name),
            spend_tier: row.spend_tier as GateEntryEvent["spend_tier"],
            created_at: String(row.created_at),
          });
        }
      )
      .subscribe();

    return () => {
      unsubBus();
      void supabase.removeChannel(channel);
    };
  }, [clubId, onEvent]);
}
