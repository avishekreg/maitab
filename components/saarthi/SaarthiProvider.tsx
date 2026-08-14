"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SaarthiBookingDrawer } from "@/components/saarthi/booking-drawer";

export type SaarthiBookingPrefill = {
  carDetails?: string;
};

type SaarthiContextValue = {
  openBooking: (prefill?: SaarthiBookingPrefill) => void;
  closeBooking: () => void;
};

const SaarthiContext = createContext<SaarthiContextValue | null>(null);

export function SaarthiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<SaarthiBookingPrefill>({});
  const openBooking = useCallback((next?: SaarthiBookingPrefill) => {
    setPrefill(next ?? {});
    setOpen(true);
  }, []);
  const closeBooking = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ openBooking, closeBooking }),
    [openBooking, closeBooking]
  );

  return (
    <SaarthiContext.Provider value={value}>
      {children}
      <SaarthiBookingDrawer
        open={open}
        onClose={closeBooking}
        prefill={prefill}
      />
    </SaarthiContext.Provider>
  );
}

export function useSaarthiBooking() {
  const ctx = useContext(SaarthiContext);
  return ctx;
}
