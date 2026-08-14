"use client";

import Link from "next/link";
import { MENU_ITEMS } from "@/lib/demo/data";
import { formatINR } from "@/lib/utils";

/** Compact drink strip in the guest app header — unique items from the shared catalog. */
export function GuestHeaderMenu() {
  return (
    <div className="-mx-4 border-t border-white/10 bg-black/25">
      <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.name}
            href="/menu"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {item.category}
            </span>
            <span className="text-xs font-medium text-foreground">{item.name}</span>
            <span className="text-[11px] tabular-nums text-accent-gold">
              {formatINR(item.unit_price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
