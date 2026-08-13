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
  violet: "border-violet-200 bg-pastel-lavender text-accent-violet",
  gold: "border-amber-200 bg-pastel-peach text-accent-gold",
  emerald: "border-emerald-200 bg-pastel-mint text-emerald-700",
  ruby: "border-rose-200 bg-pastel-rose text-accent-ruby",
  muted: "border-border bg-secondary text-muted-foreground",
  cyan: "border-sky-200 bg-pastel-sky text-cyan-700",
  purple: "border-violet-200 bg-pastel-lavender text-accent-violet",
  ready: "border-emerald-200 bg-pastel-mint text-emerald-700",
  danger: "border-rose-200 bg-pastel-rose text-accent-ruby",
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
