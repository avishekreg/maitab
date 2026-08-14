"use client";

import { useVenueStore } from "@/lib/store/venue-store";
import { formatINR } from "@/lib/utils";

/** Top-bar multi-property venue context switcher */
export function VenueSwitcher({ compact = false }: { compact?: boolean }) {
  const venues = useVenueStore((s) => s.venues);
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const setActiveVenueId = useVenueStore((s) => s.setActiveVenueId);
  const active = venues.find((v) => v.id === activeVenueId) ?? venues[0];

  return (
    <label className="flex min-w-0 items-center gap-2 text-left">
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 lg:inline">
        Venue
      </span>
      <select
        value={activeVenueId}
        onChange={(e) => setActiveVenueId(e.target.value)}
        className="max-w-[180px] truncate rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm font-medium text-zinc-100 outline-none focus:border-violet-400"
        aria-label="Switch venue property"
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.short_name}
          </option>
        ))}
      </select>
      {!compact && active ? (
        <span className="hidden text-[10px] text-zinc-400 xl:inline">
          Live GMV {formatINR(active.live_gmv)}
        </span>
      ) : null}
    </label>
  );
}
