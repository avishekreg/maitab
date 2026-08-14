"use client";

import { useEffect, useState } from "react";
import { AdminSection } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { formatINR } from "@/lib/utils";
import type { MenuItemRow, ClubZoneRow } from "@/lib/ops/crud-store";

interface Props {
  venueId: string;
}

export function ClubCrudPanels({ venueId }: Props) {
  const [menu, setMenu] = useState<MenuItemRow[]>([]);
  const [zones, setZones] = useState<ClubZoneRow[]>([]);
  const [managers, setManagers] = useState<
    { id: string; name: string; email: string }[]
  >([
    { id: "mgr-1", name: "Maya Floor", email: "manager@maitab.demo" },
  ]);
  const [note, setNote] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "COCKTAIL",
    unit_price: 500,
  });
  const [newZone, setNewZone] = useState({
    zone_name: "",
    table_range: "11,12,13",
  });
  const [newMgr, setNewMgr] = useState({ name: "", email: "" });
  const [newVenue, setNewVenue] = useState({ name: "", short_name: "" });

  async function refresh() {
    const [m, z] = await Promise.all([
      fetch(`/api/ops/crud?entity=menu&venueId=${venueId}`).then((r) => r.json()),
      fetch(`/api/ops/crud?entity=zones&venueId=${venueId}`).then((r) =>
        r.json()
      ),
    ]);
    setMenu((m.items as MenuItemRow[]) ?? []);
    setZones((z.items as ClubZoneRow[]) ?? []);
  }

  useEffect(() => {
    void refresh();
  }, [venueId]);

  async function addMenu() {
    if (!newItem.name) return;
    await fetch("/api/ops/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "menu", venueId, ...newItem }),
    });
    setNewItem({ name: "", category: "COCKTAIL", unit_price: 500 });
    setNote("Menu item saved");
    await refresh();
  }

  async function removeMenu(id: string) {
    await fetch("/api/ops/crud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "menu", id }),
    });
    await refresh();
  }

  async function addZone() {
    if (!newZone.zone_name) return;
    await fetch("/api/ops/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "zones",
        venueId,
        zone_name: newZone.zone_name,
        table_range: newZone.table_range,
      }),
    });
    setNewZone({ zone_name: "", table_range: "" });
    setNote("Floor zone saved");
    await refresh();
  }

  async function removeZone(id: string) {
    await fetch("/api/ops/crud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "zones", id }),
    });
    await refresh();
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <AdminSection
        title="Venues & managers"
        description="Add / edit portfolio properties and assign venue managers."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="New venue name"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              value={newVenue.name}
              onChange={(e) =>
                setNewVenue((v) => ({ ...v, name: e.target.value }))
              }
            />
            <NeonButton
              size="sm"
              onClick={() => {
                if (!newVenue.name) return;
                setNote(
                  `Venue "${newVenue.name}" queued — use multi-venue switcher after refresh (demo).`
                );
                setNewVenue({ name: "", short_name: "" });
              }}
            >
              Add venue
            </NeonButton>
          </div>
          <ul className="space-y-2 text-sm">
            {managers.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>
                  {m.name} · {m.email}
                </span>
                <NeonButton
                  size="sm"
                  tone="ghost"
                  onClick={() =>
                    setManagers((prev) => prev.filter((x) => x.id !== m.id))
                  }
                >
                  Remove
                </NeonButton>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Manager name"
              className="h-10 min-w-[140px] flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              value={newMgr.name}
              onChange={(e) =>
                setNewMgr((v) => ({ ...v, name: e.target.value }))
              }
            />
            <input
              placeholder="email"
              className="h-10 min-w-[140px] flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              value={newMgr.email}
              onChange={(e) =>
                setNewMgr((v) => ({ ...v, email: e.target.value }))
              }
            />
            <NeonButton
              size="sm"
              onClick={() => {
                if (!newMgr.name) return;
                setManagers((prev) => [
                  {
                    id: `mgr-${crypto.randomUUID()}`,
                    name: newMgr.name,
                    email: newMgr.email || "manager@venue.local",
                  },
                  ...prev,
                ]);
                setNewMgr({ name: "", email: "" });
              }}
            >
              Assign manager
            </NeonButton>
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Menus, prices & zones"
        description="Live CRUD — changes apply without redeploy."
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Menu
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {menu.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {item.name} · {item.category} · {formatINR(item.unit_price)}
                  </span>
                  <NeonButton
                    size="sm"
                    tone="ghost"
                    onClick={() => void removeMenu(item.id)}
                  >
                    Delete
                  </NeonButton>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                placeholder="Item"
                className="h-10 w-28 rounded-lg border border-border bg-background px-2 text-sm"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, name: e.target.value }))
                }
              />
              <input
                placeholder="Cat"
                className="h-10 w-24 rounded-lg border border-border bg-background px-2 text-sm"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((v) => ({ ...v, category: e.target.value }))
                }
              />
              <input
                type="number"
                className="h-10 w-24 rounded-lg border border-border bg-background px-2 text-sm"
                value={newItem.unit_price}
                onChange={(e) =>
                  setNewItem((v) => ({
                    ...v,
                    unit_price: Number(e.target.value),
                  }))
                }
              />
              <NeonButton size="sm" onClick={() => void addMenu()}>
                Add
              </NeonButton>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Floor zones
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {zones.map((z) => (
                <li
                  key={z.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {z.zone_name} · tables {z.table_range.join(", ")}
                  </span>
                  <NeonButton
                    size="sm"
                    tone="ghost"
                    onClick={() => void removeZone(z.id)}
                  >
                    Delete
                  </NeonButton>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                placeholder="Zone name"
                className="h-10 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
                value={newZone.zone_name}
                onChange={(e) =>
                  setNewZone((v) => ({ ...v, zone_name: e.target.value }))
                }
              />
              <input
                placeholder="1,2,3"
                className="h-10 w-28 rounded-lg border border-border bg-background px-2 text-sm"
                value={newZone.table_range}
                onChange={(e) =>
                  setNewZone((v) => ({ ...v, table_range: e.target.value }))
                }
              />
              <NeonButton size="sm" onClick={() => void addZone()}>
                Add zone
              </NeonButton>
            </div>
          </div>
        </div>
        {note ? (
          <p className="mt-3 text-sm text-accent-emerald">{note}</p>
        ) : null}
      </AdminSection>
    </div>
  );
}
