import { cn } from "@/lib/utils";

type BadgeDensity = "strip" | "stack" | "micro";

interface ResponsibleBadgesProps {
  density?: BadgeDensity;
  className?: string;
  onDark?: boolean;
}

/**
 * Responsible hospitality compliance badges — Drink Responsibly (21+)
 * and Don't Drink & Drive.
 */
export function ResponsibleBadges({
  density = "strip",
  className,
  onDark = true,
}: ResponsibleBadgesProps) {
  const wrap =
    density === "stack"
      ? "flex flex-col gap-2"
      : density === "micro"
        ? "flex flex-wrap items-center justify-center gap-2"
        : "flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center";

  return (
    <div
      role="group"
      aria-label="Responsible hospitality"
      className={cn(wrap, className)}
    >
      <DrinkResponsiblyBadge onDark={onDark} micro={density === "micro"} />
      <DontDrinkAndDriveBadge onDark={onDark} micro={density === "micro"} />
    </div>
  );
}

function DrinkResponsiblyBadge({
  onDark,
  micro,
}: {
  onDark: boolean;
  micro?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 text-amber-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
        micro ? "px-2.5 py-1 text-[10px] leading-tight" : "px-3.5 py-2 text-xs sm:text-sm",
        !onDark && "bg-slate-950/80 text-amber-50"
      )}
    >
      <AgeShieldIcon className={micro ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span className="font-medium tracking-wide">
        {micro
          ? "Drink Responsibly · 21+"
          : "Drink Responsibly • Be 21+ & Know Your Limit"}
      </span>
    </div>
  );
}

function DontDrinkAndDriveBadge({
  onDark,
  micro,
}: {
  onDark: boolean;
  micro?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-black/40 text-cyan-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
        micro ? "px-2.5 py-1 text-[10px] leading-tight" : "px-3.5 py-2 text-xs sm:text-sm",
        !onDark && "bg-slate-950/80 text-cyan-50"
      )}
    >
      <SafeRideIcon className={micro ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span className="font-medium tracking-wide">
        {micro
          ? "Don't Drink & Drive"
          : "Don't Drink & Drive • Book a Safe Ride Home"}
      </span>
    </div>
  );
}

function AgeShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 text-amber-400", className)}
      aria-hidden
    >
      <path
        d="M12 3l7 3v5.2c0 4.4-2.9 8.3-7 9.8-4.1-1.5-7-5.4-7-9.8V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.2h2.3c1.1 0 1.9-.7 1.9-1.7S12.6 8.8 11.5 8.8H9.2v6.4h1.35V13.4h.9L13.4 15.2h1.55l-2.1-2.1c.9-.3 1.5-1.1 1.5-2.1 0-1.5-1.1-2.5-2.85-2.5H7.85v6.7H9.2v-3z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function SafeRideIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 text-cyan-300", className)}
      aria-hidden
    >
      <path
        d="M4 15.5h16M5.5 15.5l1.2-4.2A2 2 0 0 1 8.6 10h6.8a2 2 0 0 1 1.9 1.3l1.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="17.2" r="1.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="17.2" r="1.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.2 10.2V8.6A1.6 1.6 0 0 1 10.8 7h2.4a1.6 1.6 0 0 1 1.6 1.6v1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ResponsibleBadges;
