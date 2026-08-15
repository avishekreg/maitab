import Link from "next/link";
import { cn } from "@/lib/utils";

/** Unified mAITab signature: m + gradient AI + Tab. Display font unchanged. */
export function BrandLockup({
  href = "/",
  className,
  as = "link",
}: {
  href?: string;
  className?: string;
  as?: "link" | "mark";
}) {
  const inner = (
    <>
      <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] font-black text-white">
        M+
      </span>
      <span className="font-display text-[15px] tracking-tight">
        <span className="font-extrabold text-white">m</span>
        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text font-black text-transparent">
          AI
        </span>
        <span className="font-extrabold text-white">Tab</span>
      </span>
    </>
  );

  const pill =
    "flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5";

  if (as === "mark") {
    return <div className={cn(pill, className)}>{inner}</div>;
  }

  return (
    <Link href={href} className={cn(pill, className)} aria-label="mAITab">
      {inner}
    </Link>
  );
}
