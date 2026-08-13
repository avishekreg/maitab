"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_PROPERTY_VENUES,
  type DemoVenue,
} from "@/lib/demo/venues";
import { NEON_CLUB_ID } from "@/lib/supabase/env";

interface VenueState {
  activeVenueId: string;
  venues: DemoVenue[];
  setActiveVenueId: (id: string) => void;
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set, get) => ({
      activeVenueId: NEON_CLUB_ID,
      venues: DEMO_PROPERTY_VENUES,
      setActiveVenueId: (id) => {
        if (get().venues.some((v) => v.id === id)) {
          set({ activeVenueId: id });
        }
      },
    }),
    { name: "maitab-active-venue" }
  )
);

export function selectActiveVenue(state: VenueState): DemoVenue {
  return (
    state.venues.find((v) => v.id === state.activeVenueId) ?? state.venues[0]!
  );
}
