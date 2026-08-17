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
  violet: "border-violet-500/20 bg-zinc-800 text-violet-300",
  gold: "border-amber-500/20 bg-zinc-800 text-amber-300",
  emerald: "border-emerald-500/20 bg-zinc-800 text-emerald-300",
  ruby: "border-rose-500/20 bg-zinc-800 text-rose-300",
  muted: "border-zinc-600/40 bg-zinc-800 text-zinc-300",
  cyan: "border-cyan-500/20 bg-zinc-800 text-cyan-300",
  purple: "border-violet-500/20 bg-zinc-800 text-violet-300",
  ready: "border-emerald-500/20 bg-zinc-800 text-emerald-300",
  danger: "border-rose-500/20 bg-zinc-800 text-rose-300",
};

export function StatusPill({
  label,
  tone = "muted",
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-zinc-800 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
        TONE[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
