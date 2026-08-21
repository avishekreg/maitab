"use client";

import { cn } from "@/lib/utils";

/** Simple page wrapper — no entrance animation (foundation repair). */
export function PageEnter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
