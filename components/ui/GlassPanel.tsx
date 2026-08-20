import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: "violet" | "gold" | "emerald" | "cyan" | "purple" | "none";
  interactive?: boolean;
}

/** Optimus-inspired frosted glass surface with optional luxury sheen */
export function GlassPanel({
  children,
  className,
  glow = "none",
  interactive = false,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "optimus-glass lux-sheen relative overflow-hidden rounded-xl",
        interactive && "lux-interactive",
        glow === "violet" && "shadow-glow-violet",
        glow === "gold" && "shadow-glow-gold",
        glow === "emerald" && "shadow-glow-emerald",
        glow === "cyan" && "shadow-glow-cyan",
        glow === "purple" && "shadow-glow-violet",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-glass-shine opacity-60" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
