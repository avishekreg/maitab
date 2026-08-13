import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: "violet" | "gold" | "emerald" | "cyan" | "purple" | "none";
}

/** Optimus-inspired frosted glass surface */
export function GlassPanel({
  children,
  className,
  glow = "none",
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "optimus-glass relative overflow-hidden rounded-xl",
        glow === "violet" && "shadow-glow-violet",
        glow === "gold" && "shadow-glow-gold",
        glow === "emerald" && "shadow-glow-emerald",
        (glow === "cyan" || glow === "purple") && "shadow-glow-violet",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-glass-shine opacity-70" />
      <div className="relative">{children}</div>
    </div>
  );
}
