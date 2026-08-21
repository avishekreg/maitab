import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SINGLE SOURCE OF TRUTH for the mAITab logo.
 * Mark asset: `/icons/maitab-mark.svg` — do not invent alternate marks elsewhere.
 */
export const MAITAB_MARK_SRC = "/icons/maitab-mark.svg";

type BrandLockupProps = {
  href?: string;
  className?: string;
  as?: "link" | "mark";
  iconOnly?: boolean;
  onDark?: boolean;
};

function Wordmark() {
  return (
    <span className="font-display text-[15px] tracking-tight">
      <span className="font-extrabold text-white">m</span>
      <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text font-black text-transparent">
        AI
      </span>
      <span className="font-extrabold text-white">Tab</span>
    </span>
  );
}

export function BrandLockup({
  href = "/",
  className,
  as = "link",
  iconOnly = false,
}: BrandLockupProps) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MAITAB_MARK_SRC}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-md"
      />
      {iconOnly ? null : <Wordmark />}
    </>
  );

  const pill = cn(
    "inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5",
    iconOnly && "justify-center px-1.5",
    className
  );

  if (as === "mark" || !href) {
    return (
      <div className={pill} aria-label="mAITab">
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={pill} aria-label="mAITab">
      {inner}
    </Link>
  );
}

/** Legacy MaiTabLogo API → BrandLockup only (one logo system). */
export function MaiTabLogo({
  variant = "FullLogoWithText",
  className,
}: {
  variant?: "FullLogoWithText" | "IconOnly" | "Monochrome" | "FaviconSVG";
  className?: string;
  title?: string;
  onDark?: boolean;
}) {
  const iconOnly = variant === "IconOnly" || variant === "FaviconSVG";
  return (
    <BrandLockup as="mark" iconOnly={iconOnly} className={className} />
  );
}

export const MAITabLogo = MaiTabLogo;
export default BrandLockup;
