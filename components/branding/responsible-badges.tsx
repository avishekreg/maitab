"use client";

import { useSaarthiBooking } from "@/components/saarthi/SaarthiProvider";
import { cn } from "@/lib/utils";

export function ResponsibleBadges({
  onOpenSaarthi,
  className,
}: {
  onOpenSaarthi?: () => void;
  density?: "strip" | "stack" | "micro";
  className?: string;
}) {
  const saarthi = useSaarthiBooking();
  const open = onOpenSaarthi ?? (() => saarthi?.openBooking());

  return (
    <div
      className={cn(
        "inline-flex items-center gap-4 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950/95 px-6 py-3 shadow-2xl backdrop-blur-2xl select-none md:gap-6",
        className
      )}
    >
      <div className="flex items-center gap-3 text-left">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-400">
          21+
        </div>
        <div className="leading-tight">
          <div className="text-xs font-mono font-bold uppercase leading-snug tracking-wider text-amber-400">
            Drink Responsibly
          </div>
          <div className="text-[11px] font-medium leading-snug text-zinc-400">
            Know Your Limits • Zero Underage Service
          </div>
        </div>
      </div>

      <div className="h-7 w-px shrink-0 bg-zinc-800" />

      <button
        type="button"
        onClick={open}
        className="group flex cursor-pointer items-center gap-3 text-left outline-none transition-all"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 14v8" />
            <path d="m4.93 7.93 5.66 3.47" />
            <path d="m19.07 7.93-5.66 3.47" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-xs font-mono font-bold uppercase leading-snug tracking-wider text-cyan-400">
            Don&apos;t Drink &amp; Drive
          </div>
          <div className="text-[11px] font-medium leading-snug text-zinc-300 transition-colors group-hover:text-cyan-300">
            Book a Verified mAI Saarthi Chauffeur ➔
          </div>
        </div>
      </button>
    </div>
  );
}

export default ResponsibleBadges;
