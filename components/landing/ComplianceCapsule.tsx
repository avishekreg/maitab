"use client";

import { motion } from "framer-motion";
import { useSaarthiBooking } from "@/components/saarthi/SaarthiProvider";
import { cn } from "@/lib/utils";

function SteeringWheel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v8" />
      <path d="m4.93 7.93 5.66 3.47" />
      <path d="m19.07 7.93-5.66 3.47" />
    </svg>
  );
}

type ComplianceCapsuleProps = {
  variant?: "boundary" | "static";
  className?: string;
};

/**
 * Dual nested glass pills — idle float + hover lift/glow (21st.dev glass-card energy).
 */
export function ComplianceCapsule({
  variant = "boundary",
  className,
}: ComplianceCapsuleProps) {
  const saarthi = useSaarthiBooking();
  const boundary = variant === "boundary";

  return (
    <motion.div
      className={cn(
        "relative z-30 mx-auto flex w-full max-w-2xl flex-col items-stretch justify-between gap-2.5 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:flex-row sm:items-center sm:rounded-full",
        boundary && "mt-4 translate-y-1/2",
        className
      )}
      animate={
        boundary
          ? { y: [0, -6, 0] }
          : undefined
      }
      transition={
        boundary
          ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <motion.div
        whileHover={{
          y: -4,
          scale: 1.02,
          boxShadow: "0 0 28px rgba(245,158,11,0.28)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="flex flex-1 cursor-default items-center gap-3 rounded-2xl border border-amber-500/30 bg-zinc-900/90 px-4 py-2.5 shadow-inner transition-colors hover:border-amber-400/70 hover:bg-amber-500/10 sm:rounded-full"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-500/80 bg-amber-500/10 text-xs font-extrabold text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          21+
        </span>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold uppercase leading-none tracking-wider text-amber-400">
            Drink Responsibly
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-zinc-400">
            Know Your Limits • Zero Underage Service
          </p>
        </div>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => saarthi?.openBooking()}
        whileHover={{
          y: -4,
          scale: 1.02,
          boxShadow: "0 0 28px rgba(6,182,212,0.32)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="group flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-cyan-500/30 bg-zinc-900/90 px-4 py-2.5 text-left shadow-inner transition-colors hover:border-cyan-400/70 hover:bg-cyan-500/10 sm:rounded-full"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-cyan-500/80 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <SteeringWheel className="h-4 w-4 text-cyan-400 transition-transform duration-300 group-hover:rotate-12" />
        </span>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold uppercase leading-none tracking-wider text-cyan-400">
            Don&apos;t Drink &amp; Drive
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-zinc-300 underline decoration-cyan-500/30 transition-colors group-hover:text-white">
            Book Verified mAISaarthi Chauffeur →
          </p>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default ComplianceCapsule;
