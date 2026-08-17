"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DrillRow = { label: string; value: string; hint?: string };
export type DrillTable = { headers: string[]; rows: string[][] };

export type DrillOperatorRole =
  | "SUPER_ADMIN"
  | "CLUB_ADMIN"
  | "FLOOR_MANAGER"
  | "BARTENDER"
  | "GATE_STAFF"
  | "TELEMETRY";

const ROLE_PILL: Record<DrillOperatorRole, string> = {
  SUPER_ADMIN: "Super Admin",
  CLUB_ADMIN: "Club Admin",
  FLOOR_MANAGER: "Floor Manager",
  BARTENDER: "Bartender KDS",
  GATE_STAFF: "Gatekeeper",
  TELEMETRY: "Liquor Telemetry",
};

export type KpiDrillContent = {
  title: string;
  subtitle?: string;
  role?: DrillOperatorRole;
  rows?: DrillRow[];
  table?: DrillTable;
};

export const KPI_HOVER_CLASS =
  "cursor-pointer transition-all hover:scale-[1.02] hover:border-zinc-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.99] group";

export function InteractiveKpiCard({
  label,
  value,
  hint,
  tone = "default",
  valueClassName,
  onClick,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "gold" | "ruby" | "default";
  valueClassName?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-left shadow-xl backdrop-blur-xl",
        KPI_HOVER_CLASS,
        className
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display font-extrabold tracking-tight whitespace-nowrap",
          valueClassName || "text-2xl xl:text-3xl",
          !valueClassName && tone === "gold" && "text-amber-400",
          !valueClassName && tone === "ruby" && "text-rose-400",
          !valueClassName && tone === "default" && "text-white"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-zinc-400">{hint}</p> : null}
      <span className="mt-3 inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        View Details ➔
      </span>
    </button>
  );
}

export function KpiDrillDrawer({
  open,
  onClose,
  content,
}: {
  open: boolean;
  onClose: () => void;
  content: KpiDrillContent | null;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && content ? (
        <>
          <motion.button
            type="button"
            aria-label="Close drill-down"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
              <div>
                {content.role ? (
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {ROLE_PILL[content.role]} · Audit
                  </p>
                ) : null}
                <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
                  {content.title}
                </h2>
                {content.subtitle ? (
                  <p className="mt-1 text-sm font-medium text-zinc-400">
                    {content.subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              {content.rows?.length ? (
                <dl className="space-y-3">
                  {content.rows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                          {row.label}
                        </dt>
                        <dd className="text-right text-sm font-semibold text-zinc-100">
                          {row.value}
                        </dd>
                      </div>
                      {row.hint ? (
                        <p className="mt-1 text-xs text-zinc-500">{row.hint}</p>
                      ) : null}
                    </div>
                  ))}
                </dl>
              ) : null}
              {content.table ? (
                <div
                  className={cn(
                    "overflow-x-auto rounded-xl border border-zinc-800",
                    content.rows?.length ? "mt-4" : ""
                  )}
                >
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-zinc-900 text-[11px] uppercase tracking-widest text-zinc-400">
                      <tr>
                        {content.table.headers.map((h) => (
                          <th key={h} className="px-3 py-2.5 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.table.rows.map((row, i) => (
                        <tr key={i} className="border-t border-zinc-800">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2.5 text-zinc-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
