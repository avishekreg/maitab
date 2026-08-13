"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type NeonButtonProps = HTMLMotionProps<"button"> & {
  tone?: "violet" | "gold" | "emerald" | "ghost" | "cyan" | "purple";
  size?: "sm" | "md" | "lg";
};

const TONE: Record<NonNullable<NeonButtonProps["tone"]>, string> = {
  violet:
    "bg-accent-violet text-white shadow-glow-violet hover:brightness-110",
  gold: "bg-accent-gold text-nightlife-bg shadow-glow-gold hover:brightness-110",
  emerald:
    "bg-accent-emerald text-nightlife-bg shadow-glow-emerald hover:brightness-110",
  ghost:
    "border border-white/10 bg-white/[0.03] text-white hover:border-accent-violet/40 hover:bg-white/[0.06]",
  // aliases
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
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { y: -1 }}
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40",
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
