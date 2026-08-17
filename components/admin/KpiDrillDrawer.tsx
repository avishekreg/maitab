"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export type DrillRow = { label: string; value: string; hint?: string };
export type DrillTable = { headers: string[]; rows: string[][] };

export type KpiDrillContent = {
  title: string;
  subtitle?: string;
  rows?: DrillRow[];
  table?: DrillTable;
};

export function KpiDrillDrawer({
  open,
  onClose,
  content,
}: {
  open: boolean;
  onClose: () => void;
  content: KpiDrillContent | null;
}) {
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
                  {content.title}
                </h2>
                {content.subtitle ? (
                  <p className="mt-1 text-sm font-medium text-zinc-400">{content.subtitle}</p>
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
                        <dd className="text-right text-sm font-semibold text-white">{row.value}</dd>
                      </div>
                      {row.hint ? (
                        <p className="mt-1 text-xs text-zinc-500">{row.hint}</p>
                      ) : null}
                    </div>
                  ))}
                </dl>
              ) : null}
              {content.table ? (
                <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
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
