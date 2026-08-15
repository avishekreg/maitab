"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { QrCollateralCard } from "@/components/assets/qr-collateral-card";
import {
  TEMPLATES,
  ZONES,
  buildBatch,
  qrUrl,
  type CollateralTemplate,
  type TableAsset,
} from "@/lib/assets/qr-studio";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import { cn } from "@/lib/utils";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "neon";
}

export default function ClubAssetsPage() {
  const venue = useVenueStore(selectActiveVenue);
  const venueSlug = slug(venue.short_name);
  const [section, setSection] = useState<string>("VIP Lounge");
  const [prefix, setPrefix] = useState("VIP");
  const [start, setStart] = useState(1);
  const [count, setCount] = useState(12);
  const [custom, setCustom] = useState("");
  const [tables, setTables] = useState<TableAsset[]>([]);
  const [template, setTemplate] = useState<CollateralTemplate>("tent");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const preview = tables[0];
  const hiddenRef = useRef<HTMLDivElement>(null);

  const previewAsset = useMemo(() => {
    if (preview) return preview;
    if (template === "valet") {
      return {
        id: "valet",
        section: "Valet",
        identifier: "SAARTHI",
        url: qrUrl(venueSlug, "VALET"),
      };
    }
    if (template === "gate") {
      return {
        id: "gate",
        section: "Entrance",
        identifier: "GATE",
        url: qrUrl(venueSlug, "GATE"),
      };
    }
    return {
      id: "demo",
      section,
      identifier: `${prefix}-01`,
      url: qrUrl(venueSlug, `${prefix}-01`),
    };
  }, [preview, template, venueSlug, section, prefix]);

  function addBatch() {
    const next = buildBatch(prefix, start, count, section, venueSlug);
    setTables((prev) => {
      const ids = new Set(prev.map((t) => t.id));
      return [...prev, ...next.filter((t) => !ids.has(t.id))];
    });
  }

  function addCustom() {
    const identifier = custom.trim();
    if (!identifier) return;
    const row: TableAsset = {
      id: `${section}-${identifier}`,
      section,
      identifier,
      url: qrUrl(venueSlug, identifier),
    };
    setTables((prev) => (prev.some((t) => t.id === row.id) ? prev : [...prev, row]));
    setCustom("");
  }

  async function downloadPdf() {
    const pack =
      tables.length > 0
        ? tables
        : template === "valet"
          ? [{ id: "valet", section: "Valet", identifier: "SAARTHI", url: qrUrl(venueSlug, "VALET") }]
          : template === "gate"
            ? [{ id: "gate", section: "Entrance", identifier: "GATE", url: qrUrl(venueSlug, "GATE") }]
            : buildBatch(prefix, start, Math.max(count, 1), section, venueSlug);

    setBusy(true);
    setNote(null);
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas").then((m) => m.default),
      ]);
      const doc = new jsPDF({ unit: "in", format: template === "gate" ? "a4" : [4, 6], orientation: "portrait" });
      const nodes = hiddenRef.current?.querySelectorAll<HTMLElement>("[data-qr-card]");
      if (!nodes?.length) {
        setNote("Generate tables first, then export.");
        return;
      }
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], {
          backgroundColor: "#09090b",
          scale: 2,
          useCORS: true,
        });
        const img = canvas.toDataURL("image/png");
        if (i > 0) doc.addPage();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        doc.addImage(img, "PNG", 0.2, 0.2, pageW - 0.4, pageH - 0.4);
      }
      doc.save(`maitab-qr-${venueSlug}-${template}.pdf`);
      setNote(`Print-ready PDF · ${pack.length} cards`);
    } catch {
      setNote("PDF export failed. Allow canvas capture and retry.");
    } finally {
      setBusy(false);
    }
  }

  const exportList =
    tables.length > 0
      ? tables
      : [previewAsset];

  return (
    <AdminShell
      role="CLUB_ADMIN"
      title="Assets & QR generator"
      subtitle="High-resolution table tents, gate posters, bar standees, and valet chauffeur cards."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">Zone & batch</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    setSection(z);
                    if (z.startsWith("VIP")) setPrefix("VIP");
                    else if (z.startsWith("PDR")) setPrefix("PDR");
                    else if (z.includes("Roof")) setPrefix("RF");
                    else if (z.includes("Bar")) setPrefix("BAR");
                    else setPrefix("T");
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    section === z
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                      : "border-zinc-700 text-zinc-400"
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-[11px] uppercase tracking-wider text-zinc-400">
                Prefix
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white"
                />
              </label>
              <label className="text-[11px] uppercase tracking-wider text-zinc-400">
                Start
                <input
                  type="number"
                  value={start}
                  onChange={(e) => setStart(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white"
                />
              </label>
              <label className="text-[11px] uppercase tracking-wider text-zinc-400">
                Count
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addBatch}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950"
              >
                Generate {prefix}-{String(start).padStart(2, "0")} → {prefix}-
                {String(start + Math.max(count, 1) - 1).padStart(2, "0")}
              </button>
              <div className="flex min-w-[220px] flex-1 gap-2">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="PDR-Alpha"
                  className="h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 text-sm text-zinc-200"
                >
                  <Plus className="h-4 w-4" /> Custom
                </button>
              </div>
            </div>
            {tables.length ? (
              <p className="mt-3 text-xs text-zinc-400">{tables.length} tables queued for print</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">Collateral template</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs",
                    template === t.id
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                      : "border-zinc-700 text-zinc-400"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void downloadPdf()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950"
          >
            <Download className="h-4 w-4" />
            Download All Selected QR Cards (Print-Ready PDF)
          </button>
          {note ? <p className="text-sm text-emerald-400">{note}</p> : null}
        </div>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-400">Live preview</p>
          <QrCollateralCard
            identifier={previewAsset.identifier}
            section={previewAsset.section}
            url={previewAsset.url}
            template={template}
          />
        </div>
      </div>

      <div ref={hiddenRef} className="pointer-events-none absolute -left-[9999px] top-0 space-y-4">
        {exportList.map((t) => (
          <div key={t.id} data-qr-card>
            <QrCollateralCard
              identifier={t.identifier}
              section={t.section}
              url={t.url}
              template={template}
            />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
