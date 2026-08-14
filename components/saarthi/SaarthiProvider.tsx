"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SaarthiBookingDrawer } from "@/components/saarthi/SaarthiBookingDrawer";

type SaarthiContextValue = {
  openBooking: () => void;
  closeBooking: () => void;
};

const SaarthiContext = createContext<SaarthiContextValue | null>(null);

export function SaarthiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openBooking = useCallback(() => setOpen(true), []);
  const closeBooking = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ openBooking, closeBooking }),
    [openBooking, closeBooking]
  );

  return (
    <SaarthiContext.Provider value={value}>
      {children}
      <SaarthiBookingDrawer open={open} onClose={closeBooking} />
    </SaarthiContext.Provider>
  );
}

export function useSaarthiBooking() {
  const ctx = useContext(SaarthiContext);
  return ctx;
}
