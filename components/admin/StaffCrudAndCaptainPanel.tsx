"use client";

import { useEffect, useState } from "react";
import { AdminSection } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StaffProfile } from "@/lib/ops/crud-store";
import {
  DEMO_CLUB_ZONES,
  assignWaiterZone,
} from "@/lib/waiter/allocation";
import { DEMO_TABLES } from "@/lib/demo/data";

interface Props {
  venueId: string;
  mode: "manager" | "captain";
}

export function StaffCrudAndCaptainPanel({ venueId, mode }: Props) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    staff_role: "WAITER" as "WAITER" | "BARTENDER",
    phone: "",
  });
  const [overrideTable, setOverrideTable] = useState(DEMO_TABLES[0]?.table_code ?? "B1");
  const [overrideWaiter, setOverrideWaiter] = useState("");

  async function refresh() {
    const res = await fetch(
      `/api/ops/crud?entity=staff&venueId=${encodeURIComponent(venueId)}`
    );
    const data = (await res.json()) as { items?: StaffProfile[] };
    setStaff(data.items ?? []);
  }

  useEffect(() => {
    void refresh();
  }, [venueId]);

  async function addStaff() {
    if (!form.full_name) return;
    await fetch("/api/ops/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "staff", venueId, ...form }),
    });
    setForm({ full_name: "", staff_role: "WAITER", phone: "" });
    setNote("Staff profile saved");
    await refresh();
  }

  async function removeStaff(id: string) {
    await fetch("/api/ops/crud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "staff", id }),
    });
    await refresh();
  }

  function rushOverride() {
    const waiter = staff.find((s) => s.id === overrideWaiter) ?? staff[0];
    if (!waiter) {
      setNote("Add a waiter first");
      return;
    }
    const zone =
      DEMO_CLUB_ZONES.find((z) => z.venue_id === venueId) ?? DEMO_CLUB_ZONES[0];
    if (zone) {
      assignWaiterZone(waiter.id, zone.id, true);
    }
    setNote(
      `Rush override · ${overrideTable} → ${waiter.full_name} (${zone?.zone_name ?? "floor"})`
    );
  }

  return (
    <div className="space-y-6">
      <AdminSection
        title="Staff profiles"
        description="Add / edit / delete waiters and bartenders — then map to zones or counters above."
      >
        <ul className="space-y-2">
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-semibold">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.staff_role}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill
                  label={s.active_status ? "ACTIVE" : "OFF"}
                  tone={s.active_status ? "emerald" : "muted"}
                />
                <NeonButton
                  size="sm"
                  tone="ghost"
                  onClick={() => void removeStaff(s.id)}
                >
                  Delete
                </NeonButton>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="Full name"
            className="h-10 min-w-[140px] flex-1 rounded-lg border border-border bg-background px-3 text-sm"
            value={form.full_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, full_name: e.target.value }))
            }
          />
          <select
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
            value={form.staff_role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                staff_role: e.target.value as "WAITER" | "BARTENDER",
              }))
            }
          >
            <option value="WAITER">Waiter</option>
            <option value="BARTENDER">Bartender</option>
          </select>
          <input
            placeholder="Phone"
            className="h-10 w-36 rounded-lg border border-border bg-background px-3 text-sm"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <NeonButton size="sm" onClick={() => void addStaff()}>
            Add staff
          </NeonButton>
        </div>
        {note ? (
          <p className="mt-3 text-sm text-accent-emerald">{note}</p>
        ) : null}
      </AdminSection>

      {(mode === "captain" || mode === "manager") && (
        <AdminSection
          title="Live floor override"
          description="Reassign tables during rush hours — Floor Captain panel."
        >
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
              value={overrideTable}
              onChange={(e) => setOverrideTable(e.target.value)}
            >
              {DEMO_TABLES.map((t) => (
                <option key={t.id} value={t.table_code}>
                  Table {t.table_code}
                </option>
              ))}
            </select>
            <select
              className="h-10 min-w-[160px] rounded-lg border border-border bg-background px-2 text-sm"
              value={overrideWaiter}
              onChange={(e) => setOverrideWaiter(e.target.value)}
            >
              <option value="">Select waiter</option>
              {staff
                .filter((s) => s.staff_role === "WAITER")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
            </select>
            <NeonButton size="sm" tone="gold" onClick={rushOverride}>
              Reassign now
            </NeonButton>
          </div>
        </AdminSection>
      )}
    </div>
  );
}
