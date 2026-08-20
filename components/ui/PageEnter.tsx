"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageEnter } from "@/lib/ui/motion";

/** Route/section entrance — fade + slight slide-up. Visual only. */
export function PageEnter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("lux-enter", className)}
      initial={pageEnter.initial}
      animate={pageEnter.animate}
      transition={pageEnter.transition}
    >
      {children}
    </motion.div>
  );
}
