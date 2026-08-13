"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { subscribeBus } from "@/lib/realtime/bus";

export function useGameVotesRealtime(sessionId: string, gameId: string | null) {
  const [yes, setYes] = useState(0);
  const [no, setNo] = useState(0);

  useEffect(() => {
    if (!gameId) return;

    const unsubBus = subscribeBus("game_session_votes", (envelope) => {
      const payload = envelope.payload as {
        sessionId?: string;
        gameId?: string;
        vote?: "YES" | "NO";
        yes?: number;
        no?: number;
      };
      if (payload.sessionId && payload.sessionId !== sessionId) return;
      if (payload.gameId && payload.gameId !== gameId) return;
      if (typeof payload.yes === "number" && typeof payload.no === "number") {
        setYes(payload.yes);
        setNo(payload.no);
        return;
      }
      if (payload.vote === "YES") setYes((v) => v + 1);
      if (payload.vote === "NO") setNo((v) => v + 1);
    });

    if (!isSupabaseConfigured()) {
      return () => unsubBus();
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      return () => unsubBus();
    }

    const refresh = async () => {
      const { data } = await supabase.rpc("game_vote_tally", {
        p_session_id: sessionId,
        p_game_id: gameId,
      });
      const row = Array.isArray(data) ? data[0] : data;
      setYes(Number(row?.yes_count ?? 0));
      setNo(Number(row?.no_count ?? 0));
    };

    void refresh();

    const channel = supabase
      .channel(`game-votes-${sessionId}-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_session_votes",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      unsubBus();
      void supabase.removeChannel(channel);
    };
  }, [sessionId, gameId]);

  return { yes, no, setYes, setNo };
}
