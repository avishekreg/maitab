import { cn } from "@/lib/utils";

interface OptimusCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
}

/** Crisp Optimus glass card — use for interactive surfaces */
export function OptimusCard({
  children,
  className,
  padded = true,
  interactive = false,
}: OptimusCardProps) {
  return (
    <div
      className={cn(
        "optimus-glass lux-sheen rounded-xl",
        interactive && "lux-interactive",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function OptimusSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 animate-lux-enter">
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl leading-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
