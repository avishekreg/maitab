import Link from "next/link";
import { cn } from "@/lib/utils";

/** Unified mAITab signature: purple/cyan capsule + Syne display wordmark. */
export function BrandLockup({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 shadow-[0_0_18px_rgba(139,92,246,0.22)]",
        className,
      )}
      aria-label="mAITab"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 ring-1 ring-cyan-300/40">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 16V8l4 6 4-6v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display pr-1.5 text-[15px] font-black tracking-tight text-white">
        mAITab
      </span>
    </Link>
  );
}
