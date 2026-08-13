import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: "violet" | "gold" | "emerald" | "cyan" | "purple" | "none";
}

export function GlassPanel({
  children,
  className,
  glow = "none",
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
        glow === "violet" && "shadow-glow-violet",
        glow === "gold" && "shadow-glow-gold",
        glow === "emerald" && "shadow-glow-emerald",
        (glow === "cyan" || glow === "purple") && "shadow-glow-violet",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}
