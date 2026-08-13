import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  tone?:
    | "violet"
    | "gold"
    | "emerald"
    | "ruby"
    | "muted"
    | "cyan"
    | "purple"
    | "ready"
    | "danger";
  className?: string;
}

const TONE: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  violet: "border-accent-violet/40 bg-accent-violet/10 text-accent-violet",
  gold: "border-accent-gold/40 bg-accent-gold/10 text-accent-gold",
  emerald: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
  ruby: "border-accent-ruby/40 bg-accent-ruby/10 text-accent-ruby",
  muted: "border-white/10 bg-white/[0.03] text-nightlife-muted",
  cyan: "border-accent-violet/40 bg-accent-violet/10 text-accent-violet",
  purple: "border-accent-violet/40 bg-accent-violet/10 text-accent-violet",
  ready: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
  danger: "border-accent-ruby/40 bg-accent-ruby/10 text-accent-ruby",
};

export function StatusPill({
  label,
  tone = "muted",
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase",
        TONE[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
