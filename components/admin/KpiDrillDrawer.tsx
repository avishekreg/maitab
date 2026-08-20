"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DrillRow = { label: string; value: string; hint?: string };
export type DrillTable = { headers: string[]; rows: string[][] };
export type DrillFilter = {
  id: string;
  label: string;
  test: (row: string[], headers: string[]) => boolean;
};

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
  filters?: DrillFilter[];
};

export const KPI_HOVER_CLASS =
  "lux-sheen lux-interactive group cursor-pointer transition-all duration-lux ease-lux hover:border-zinc-300 hover:shadow-md";

const PAGE_SIZE = 8;

const DEFAULT_FILTERS: DrillFilter[] = [
  {
    id: "high-margin",
    label: "High Margin > 70%",
    test: (row) =>
      row.some((cell) => {
        const m = cell.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*%/);
        return m ? Number(m[1]) >= 70 : /high/i.test(cell);
      }),
  },
  {
    id: "fast-moving",
    label: "Fast Moving",
    test: (row) =>
      row.some((cell) =>
        /fast|live|success|ready|on duty|settled|active/i.test(cell)
      ),
  },
  {
    id: "spill-alert",
    label: "Spill Alert",
    test: (row) =>
      row.some((cell) =>
        /spill|denied|fail|alert|variance|mismatch|idle|lockout/i.test(cell)
      ),
  },
];

function matchesQuery(cells: string[], query: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return cells.some((c) => c.toLowerCase().includes(q));
}

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
        "relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-5 text-left shadow-sm backdrop-blur-xl",
        KPI_HOVER_CLASS,
        className
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 whitespace-nowrap font-display font-extrabold tracking-tight text-zinc-950",
          valueClassName || "text-2xl xl:text-3xl",
          !valueClassName && tone === "gold" && "text-amber-600",
          !valueClassName && tone === "ruby" && "text-rose-600"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-zinc-600">{hint}</p> : null}
      <span className="mt-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
        View Details ➔
      </span>
    </button>
  );
}

function downloadBlob(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const [query, setQuery] = useState("");
  const [filterId, setFilterId] = useState("all");
  const [page, setPage] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQuery("");
    setFilterId("all");
    setPage(0);
    setExportOpen(false);
  }, [content?.title, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const pills = useMemo(() => {
    const custom = content?.filters ?? [];
    const headers = content?.table?.headers ?? [];
    const heuristic = DEFAULT_FILTERS.filter((f) => {
      if (custom.some((c) => c.id === f.id)) return false;
      if (f.id === "high-margin") {
        return headers.some((h) => /margin|%/i.test(h));
      }
      return true;
    });
    return [...custom, ...heuristic];
  }, [content]);

  const filteredTableRows = useMemo(() => {
    const table = content?.table;
    if (!table) return [];
    const active = pills.find((p) => p.id === filterId);
    return table.rows.filter((row) => {
      if (!matchesQuery(row, query)) return false;
      if (active && !active.test(row, table.headers)) return false;
      return true;
    });
  }, [content, filterId, pills, query]);

  const filteredSummary = useMemo(() => {
    const rows = content?.rows ?? [];
    if (!query.trim()) return rows;
    return rows.filter((r) =>
      matchesQuery([r.label, r.value, r.hint ?? ""], query)
    );
  }, [content, query]);

  const pageCount = Math.max(1, Math.ceil(filteredTableRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = filteredTableRows.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );
  const showingFrom =
    filteredTableRows.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(
    filteredTableRows.length,
    (safePage + 1) * PAGE_SIZE
  );

  function exportCsv() {
    const headers = content?.table?.headers ?? [];
    const lines = [
      headers.join(","),
      ...filteredTableRows.map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")
      ),
    ];
    downloadBlob(
      `${(content?.title ?? "audit").replaceAll(" ", "-").toLowerCase()}.csv`,
      "text/csv;charset=utf-8",
      lines.join("\n")
    );
  }

  function exportJson() {
    downloadBlob(
      `${(content?.title ?? "audit").replaceAll(" ", "-").toLowerCase()}.json`,
      "application/json",
      JSON.stringify(
        {
          title: content?.title,
          rows: content?.rows ?? [],
          table: {
            headers: content?.table?.headers ?? [],
            rows: filteredTableRows,
          },
        },
        null,
        2
      )
    );
  }

  const pillClass = (active: boolean) =>
    cn(
      "rounded-lg px-3.5 py-1.5 text-xs transition-all",
      active
        ? "bg-zinc-900 font-bold text-white shadow-sm"
        : "border border-zinc-300 bg-white text-zinc-600 hover:text-zinc-900"
    );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && content ? (
        <div className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label="Close drill-down"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="kpi-drill-title"
            className="fixed inset-y-0 right-0 z-[100] flex h-screen w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-300 bg-[#faf9f5] text-zinc-900 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="sticky top-0 z-20 flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 bg-[#faf9f5] px-6 pb-5 pt-7">
              <div className="min-w-0 overflow-visible">
                {content.role ? (
                  <p className="mb-1 block text-[11px] font-mono font-bold uppercase tracking-widest text-violet-600">
                    {ROLE_PILL[content.role]} · Audit
                  </p>
                ) : null}
                <h2
                  id="kpi-drill-title"
                  className="font-display text-2xl font-black leading-tight tracking-tight text-zinc-950"
                >
                  {content.title}
                </h2>
                {content.subtitle ? (
                  <p className="mt-1 text-xs font-medium text-zinc-600">
                    {content.subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 cursor-pointer rounded-full border border-zinc-300 bg-white p-2 text-zinc-600 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="shrink-0 space-y-3 border-b border-zinc-200 bg-[#faf9f5] px-6 py-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search SKU, category, table, timestamp…"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-xs text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterId("all");
                    setPage(0);
                  }}
                  className={pillClass(filterId === "all")}
                >
                  All
                </button>
                {pills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setFilterId(pill.id);
                      setPage(0);
                    }}
                    className={pillClass(filterId === pill.id)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
              {filteredSummary.length ? (
                <div className="space-y-3">
                  {filteredSummary.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                          {row.label}
                        </p>
                        {row.hint ? (
                          <p className="mt-0.5 text-xs text-zinc-500">{row.hint}</p>
                        ) : null}
                      </div>
                      <p className="font-display text-base font-extrabold text-zinc-950">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {content.table ? (
                <div>
                  <div className="sticky top-0 z-[1] grid gap-2 border-b border-zinc-200 bg-[#faf9f5] py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500"
                    style={{
                      gridTemplateColumns: `minmax(8rem,1.4fr) repeat(${Math.max(content.table.headers.length - 1, 1)}, minmax(4rem,1fr))`,
                    }}
                  >
                    {content.table.headers.map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                  </div>
                  <div className="mt-3 space-y-3">
                    {pagedRows.length ? (
                      pagedRows.map((row, i) => (
                        <div
                          key={`${safePage}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-sm transition-all hover:border-zinc-300 hover:shadow-sm"
                        >
                          <p className="min-w-0 shrink font-semibold text-zinc-900">
                            {row[0]}
                          </p>
                          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-1">
                            {row.slice(1).map((cell, j) => (
                              <span
                                key={j}
                                className="font-mono text-xs font-bold text-zinc-800"
                              >
                                {cell}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-sm text-zinc-500">
                        No records match this search or filter.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-[#faf9f5] p-4 text-xs text-zinc-600">
              <p>
                Showing {showingFrom}–{showingTo} of {filteredTableRows.length}{" "}
                records
                {filteredTableRows.length !==
                (content.table?.rows.length ?? 0)
                  ? ` · ${content.table?.rows.length ?? 0} total`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-zinc-300 bg-white p-1.5 shadow-sm hover:border-zinc-400 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-medium text-zinc-700">
                  {safePage + 1}/{pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="rounded-lg border border-zinc-300 bg-white p-1.5 shadow-sm hover:border-zinc-400 disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 font-semibold text-zinc-800 shadow-sm transition-all hover:border-zinc-400"
                  >
                    <Download className="h-3 w-3" />
                    Export CSV / JSON
                  </button>
                  {exportOpen ? (
                    <div className="absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          exportCsv();
                          setExportOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportJson();
                          setExportOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        Export JSON
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </footer>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
