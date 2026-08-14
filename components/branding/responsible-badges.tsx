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
        "inline-flex items-center gap-2 overflow-hidden rounded-full border border-zinc-800/80 bg-zinc-950/90 p-1.5 shadow-2xl backdrop-blur-xl [contain:paint] select-none",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 overflow-hidden rounded-full border border-amber-500/20 bg-zinc-900/60 px-3.5 py-1.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-400">
          21+
        </div>
        <div className="text-left leading-tight">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Drink Responsibly
          </div>
          <div className="text-[9px] text-zinc-400">
            Know Your Limits • Zero Underage Service
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={open}
        className="group flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-full border border-cyan-500/20 bg-zinc-900/60 px-3.5 py-1.5 text-left transition-colors hover:border-cyan-500/50 hover:bg-cyan-950/20"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <path strokeWidth="2" d="M12 2v8M12 14v8M2 12h8M14 12h8" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            Don&apos;t Drink &amp; Drive
          </div>
          <div className="text-[9px] text-zinc-300 transition-colors group-hover:text-cyan-300">
            Book a Verified mAI Saarthi Chauffeur ➔
          </div>
        </div>
      </button>
    </div>
  );
}

export default ResponsibleBadges;
