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
  pulse?: boolean;
}

const TONE: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  violet: "border-violet-200 bg-pastel-lavender text-accent-violet",
  gold: "border-amber-500/20 bg-zinc-100 text-amber-700",
  emerald: "border-emerald-200 bg-pastel-mint text-emerald-700",
  ruby: "border-rose-200 bg-pastel-rose text-accent-ruby",
  muted: "border-zinc-300 bg-zinc-100 text-zinc-600",
  cyan: "border-sky-200 bg-pastel-sky text-cyan-700",
  purple: "border-violet-200 bg-pastel-lavender text-accent-violet",
  ready: "border-emerald-200 bg-pastel-mint text-emerald-700",
  danger: "border-rose-200 bg-pastel-rose text-accent-ruby",
};

export function StatusPill({
  label,
  tone = "muted",
  className,
  pulse = false,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-shadow duration-lux ease-lux",
        TONE[tone],
        pulse && "animate-priority-pulse",
        className
      )}
    >
      {label}
    </span>
  );
}
