"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

/** Existing APKs still load `/`; send the native wrapper to the login portal. */
export function CapacitorLoginRedirect() {
  useEffect(() => {
    const native = Boolean(
      window.Capacitor?.isNativePlatform?.() || window.Capacitor
    );
    if (native && window.location.pathname === "/") {
      window.location.replace("/login");
    }
  }, []);

  return null;
}
