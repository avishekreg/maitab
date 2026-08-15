"use client";

import { useState } from "react";
import { Camera, Upload, Zap } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { ParsedMenuItem } from "@/lib/menu/ai-scanner";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import { formatINR } from "@/lib/utils";

export default function MenuScanPage() {
  const venue = useVenueStore(selectActiveVenue);
  const [items, setItems] = useState<ParsedMenuItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [filesLabel, setFilesLabel] = useState("Drop photos or PDFs of the physical menu");

  async function ingest(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setBusy(true);
    setNote(null);
    setFilesLabel(`${files.length} file(s) · extracting`);
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    const res = await fetch("/api/menu/scan", { method: "POST", body });
    const data = (await res.json()) as { parsed_items?: ParsedMenuItem[] };
    setItems(data.parsed_items ?? []);
    setBusy(false);
    setFilesLabel(`${data.parsed_items?.length ?? 0} items extracted · review before sync`);
  }

  function patch(id: string, field: keyof ParsedMenuItem, value: string | number) {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  async function approve() {
    setBusy(true);
    for (const row of items) {
      await fetch("/api/ops/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "menu",
          venueId: venue.id,
          name: row.item_name,
          category: row.category,
          unit_price: row.price,
          active_status: true,
        }),
      });
    }
    setBusy(false);
    setNote(`${items.length} SKUs approved and synced to the live digital menu.`);
  }

  return (
    <AdminShell
      role="CLUB_ADMIN"
      title="AI menu scanner"
      subtitle="Photograph a physical bar or food menu — extract SKUs, prices, and pour specs, then sync live."
    >
      <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-500/40 bg-zinc-900/70 p-8 text-center">
        <Upload className="h-8 w-8 text-cyan-400" />
        <p className="mt-3 font-display text-lg font-extrabold text-white">Photo-to-menu capture</p>
        <p className="mt-1 text-sm font-medium text-zinc-400">{filesLabel}</p>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
          }}
        />
        <span className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200">
          <Camera className="h-4 w-4" /> Choose photos / PDF
        </span>
      </label>

      {busy && !items.length ? (
        <p className="mt-4 text-sm text-cyan-300">Running vision extraction…</p>
      ) : null}

      {items.length ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-zinc-950 text-[11px] uppercase tracking-widest text-zinc-400">
                <tr>
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Subtype</th>
                  <th className="px-3 py-3">Volume</th>
                  <th className="px-3 py-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-800">
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-white"
                        value={row.item_name}
                        onChange={(e) => patch(row.id, "item_name", e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-zinc-500">{row.description}</p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-white"
                        value={row.category}
                        onChange={(e) => patch(row.id, "category", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-white"
                        value={row.subtype}
                        onChange={(e) => patch(row.id, "subtype", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-white"
                        value={row.volume_spec}
                        onChange={(e) => patch(row.id, "volume_spec", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-amber-400"
                        value={row.price}
                        onChange={(e) => patch(row.id, "price", Number(e.target.value))}
                      />
                      <p className="mt-1 text-[11px] text-zinc-500">{formatINR(row.price)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-800 p-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void approve()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950"
            >
              <Zap className="h-4 w-4" />
              Approve &amp; Sync to Live Digital Menu
            </button>
            {note ? <p className="mt-2 text-sm text-emerald-400">{note}</p> : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
