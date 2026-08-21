"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/session-store";
import type { ActiveSession, Order, UserProfile } from "@/lib/types";

/** Pull permanent guest + open night attachment into the Zustand shell. */
export function useGuestIdentityHydration() {
  const hydrateGuestShell = useSessionStore((s) => s.hydrateGuestShell);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/sessions/current")
      .then((r) => r.json())
      .then(
        (json: {
          ok?: boolean;
          user?: UserProfile;
          session?: ActiveSession | null;
          orders?: Order[];
          venue?: {
            club_id: string;
            club_name: string;
            table_id: string;
            table_code: string;
          } | null;
        }) => {
          if (cancelled || !json?.ok || !json.user) return;
          hydrateGuestShell({
            user: json.user,
            session: json.session ?? null,
            orders: json.orders,
            venue: json.venue ?? null,
          });
        }
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hydrateGuestShell]);
}
