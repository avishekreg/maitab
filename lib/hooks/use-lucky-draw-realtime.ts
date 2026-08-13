"use client";

import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { subscribeBus } from "@/lib/realtime/bus";

export interface LuckyDrawAward {
  id: string;
  club_id: string;
  session_id: string;
  discount_percent: number;
  awarded_at: string;
}

export function useLuckyDrawRealtime(
  clubId: string,
  onAward: (award: LuckyDrawAward) => void
) {
  useEffect(() => {
    const unsubBus = subscribeBus("lucky_draw_awards", (envelope) => {
      onAward(envelope.payload as LuckyDrawAward);
    });

    if (!isSupabaseConfigured()) {
      return () => unsubBus();
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => unsubBus();
    }

    const channel = supabase
      .channel(`lucky-draw-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lucky_draw_awards",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onAward({
            id: String(row.id),
            club_id: String(row.club_id),
            session_id: String(row.session_id),
            discount_percent: Number(row.discount_percent ?? 25),
            awarded_at: String(row.awarded_at),
          });
        }
      )
      .subscribe();

    return () => {
      unsubBus();
      void supabase.removeChannel(channel);
    };
  }, [clubId, onAward]);
}
