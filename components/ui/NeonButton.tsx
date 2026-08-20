"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { LUX_EASE } from "@/lib/ui/motion";

type NeonButtonProps = HTMLMotionProps<"button"> & {
  tone?: "violet" | "gold" | "emerald" | "ghost" | "cyan" | "purple" | "primary";
  size?: "sm" | "md" | "lg";
};

const TONE: Record<NonNullable<NeonButtonProps["tone"]>, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:opacity-90",
  violet:
    "bg-accent-violet text-white shadow-glow-violet hover:brightness-110",
  gold: "bg-accent-gold text-white shadow-glow-gold hover:brightness-110",
  emerald:
    "bg-accent-emerald text-white shadow-glow-mint hover:brightness-110",
  ghost:
    "border border-border bg-card/80 text-foreground hover:bg-secondary",
  cyan: "bg-accent-violet text-white shadow-glow-violet hover:brightness-110",
  purple:
    "bg-accent-violet text-white shadow-glow-violet hover:brightness-110",
};

const SIZE: Record<NonNullable<NeonButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

export function NeonButton({
  children,
  className,
  tone = "violet",
  size = "md",
  disabled,
  type = "button",
  ...props
}: NeonButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ duration: 0.18, ease: LUX_EASE }}
      type={type}
      disabled={disabled}
      className={cn(
        "lux-focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-[box-shadow,filter,background-color] duration-lux ease-lux disabled:cursor-not-allowed disabled:opacity-40",
        TONE[tone],
        SIZE[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
