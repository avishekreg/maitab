"use client";

import { useVenueStore } from "@/lib/store/venue-store";
import { formatINR } from "@/lib/utils";

/** Top-bar multi-property venue context switcher */
export function VenueSwitcher() {
  const venues = useVenueStore((s) => s.venues);
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const setActiveVenueId = useVenueStore((s) => s.setActiveVenueId);
  const active = venues.find((v) => v.id === activeVenueId) ?? venues[0];

  return (
    <label className="flex min-w-0 flex-col gap-0.5 text-left">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Venue
      </span>
      <select
        value={activeVenueId}
        onChange={(e) => setActiveVenueId(e.target.value)}
        className="max-w-[220px] truncate rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground outline-none focus:border-accent-gold"
        aria-label="Switch venue property"
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.short_name}
          </option>
        ))}
      </select>
      {active ? (
        <span className="hidden text-[10px] text-muted-foreground sm:block">
          Live GMV {formatINR(active.live_gmv)} · Credits{" "}
          {formatINR(active.credit_balance)}
        </span>
      ) : null}
    </label>
  );
}
