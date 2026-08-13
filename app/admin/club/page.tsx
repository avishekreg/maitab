"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminSection, AdminShell, KpiStrip } from "@/components/admin/AdminShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  DEMO_CLUB,
  DEMO_ORDERS,
  DEMO_SESSION,
  DEMO_TABLES,
  MENU_ITEMS,
} from "@/lib/demo/data";
import { publishBus } from "@/lib/realtime/bus";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import {
  COMPETITOR_CLUB_ID,
  TABLE_B4_ID,
} from "@/lib/supabase/env";
import { cn, formatINR } from "@/lib/utils";

const CHILD_IDS = [
  "b0000000-0000-0000-0000-000000000005",
  "b0000000-0000-0000-0000-000000000006",
];

export default function ClubAdminPage() {
  const venue = useVenueStore(selectActiveVenue);
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const [tables, setTables] = useState(DEMO_TABLES);
  const [displayOn, setDisplayOn] = useState(DEMO_CLUB.display_enabled);
  const [luckyDraw, setLuckyDraw] = useState(DEMO_CLUB.lucky_draw_enabled);
  const [mergeNote, setMergeNote] = useState<string | null>(null);
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const [drawNote, setDrawNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const sales = useMemo(
    () =>
      activeVenueId === DEMO_CLUB.id
        ? DEMO_ORDERS.reduce((sum, order) => sum + order.total_amount, 0)
        : venue.live_gmv,
    [activeVenueId, venue.live_gmv]
  );

  async function mergeB4Cluster() {
    setBusy("merge");
    const prebookLocked = tables.some((table) => {
      if (table.status !== "PRE_BOOKED" || !table.prebook_slot_start) {
        return false;
      }
      const start = new Date(table.prebook_slot_start).getTime();
      const bufferMs = DEMO_CLUB.prebook_buffer_minutes * 60_000;
      return start - Date.now() <= bufferMs && start >= Date.now();
    });

    if (prebookLocked) {
      setMergeNote(
        `Blocked — a pre-booked table is inside the ${DEMO_CLUB.prebook_buffer_minutes}m buffer.`
      );
      setBusy(null);
      return;
    }

    const res = await fetch("/api/tables/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentTableId: TABLE_B4_ID,
        childTableIds: CHILD_IDS,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      reason?: string;
      message?: string;
      mode?: string;
    };

    if (!data.ok) {
      setMergeNote(data.reason ?? "Merge failed");
      setBusy(null);
      return;
    }

    setTables((prev) =>
      prev.map((table) => {
        if (table.table_code === "B4") {
          return {
            ...table,
            id: TABLE_B4_ID,
            status: "MERGED_PARENT",
            parent_table_id: null,
          };
        }
        if (table.table_code === "B5" || table.table_code === "B6") {
          return {
            ...table,
            status: "MERGED_CHILD",
            parent_table_id: TABLE_B4_ID,
          };
        }
        return table;
      })
    );
    setMergeNote(
      data.message ??
        `Merged B4 + B5 + B6. Child QR scans route to the host table.`
    );
    setBusy(null);
  }

  async function tryFlashPromo() {
    setBusy("promo");
    const res = await fetch("/api/promos/flash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId: activeVenueId,
        category: "BEER",
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      reason?: string;
      mode?: string;
    };
    setPromoNote(
      data.ok
        ? `BEER flash promo live on ${venue.short_name}.`
        : data.reason ??
            `Blocked by nearby competitor (${COMPETITOR_CLUB_ID.slice(0, 8)}…)`
    );
    setBusy(null);
  }

  async function runLuckyDraw() {
    setBusy("draw");
    const res = await fetch("/api/lucky-draw/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId: activeVenueId }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      award?: {
        session_id: string;
        discount_percent: number;
      };
      message?: string;
      reason?: string;
    };

    if (!data.ok) {
      setDrawNote(data.reason ?? "Lucky draw failed");
      setBusy(null);
      return;
    }

    if (data.award) {
      publishBus("lucky_draw_awards", "INSERT", data.award);
      setDrawNote(
        `Winner · ${data.award.discount_percent}% off · session ${data.award.session_id.slice(0, 8)}…`
      );
    } else {
      setDrawNote(data.message ?? "No eligible sessions this hour");
    }
    setBusy(null);
  }

  return (
    <AdminShell
      role="CLUB_ADMIN"
      title={venue.short_name}
      subtitle="Multi-venue ops — switch property in the top bar to swap Live GMV, inventory, staff, and KDS context."
      actions={
        <>
          <Link
            href="/admin/club/promos"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            Flash campaigns
          </Link>
          <NeonButton
            size="sm"
            tone="ghost"
            onClick={() => setDisplayOn((v) => !v)}
          >
            Display {displayOn ? "On" : "Off"}
          </NeonButton>
          <NeonButton
            size="sm"
            tone={luckyDraw ? "emerald" : "ghost"}
            onClick={() => setLuckyDraw((v) => !v)}
          >
            Lucky Draw {luckyDraw ? "On" : "Off"}
          </NeonButton>
        </>
      }
    >
      <KpiStrip
        items={[
          { label: "Live GMV", value: formatINR(sales), tone: "gold" },
          {
            label: "Promo credits",
            value: formatINR(venue.credit_balance),
          },
          {
            label: "Open session",
            value: formatINR(
              activeVenueId === DEMO_CLUB.id
                ? DEMO_SESSION.total_session_spend
                : 0
            ),
          },
          {
            label: "Floor status",
            value: displayOn ? "Live" : "Hidden",
          },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminSection
          title="Menu"
          description="Tonight’s SKUs and promotional controls."
          action={
            <div className="flex flex-wrap gap-2">
              <NeonButton
                size="sm"
                tone="violet"
                disabled={busy === "promo"}
                onClick={() => void tryFlashPromo()}
              >
                Flash BEER
              </NeonButton>
              <NeonButton
                size="sm"
                tone="gold"
                disabled={busy === "draw"}
                onClick={() => void runLuckyDraw()}
              >
                Run draw
              </NeonButton>
            </div>
          }
        >
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Item</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {MENU_ITEMS.map((item, index) => (
                  <tr
                    key={item.name}
                    className={cn(
                      "border-t border-border",
                      index % 2 === 1 && "bg-white/[0.015]"
                    )}
                  >
                    <td className="px-3 py-3 font-medium text-foreground">
                      {item.name}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {item.category}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-accent-gold">
                      {formatINR(item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(promoNote || drawNote) && (
            <div className="mt-4 space-y-1.5 text-sm">
              {promoNote ? (
                <p
                  className={
                    promoNote.startsWith("BEER")
                      ? "text-accent-emerald"
                      : "text-accent-ruby"
                  }
                >
                  {promoNote}
                </p>
              ) : null}
              {drawNote ? (
                <p className="text-accent-emerald">{drawNote}</p>
              ) : null}
            </div>
          )}
        </AdminSection>

        <AdminSection
          title="Tables"
          description={`Merge respects a ${DEMO_CLUB.prebook_buffer_minutes}m pre-book buffer.`}
          action={
            <NeonButton
              size="sm"
              disabled={busy === "merge"}
              onClick={() => void mergeB4Cluster()}
            >
              Merge B4–B6
            </NeonButton>
          }
        >
          <ul className="space-y-1">
            {tables.map((table) => (
              <li
                key={table.id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary"
              >
                <div>
                  <p className="type-title text-base text-foreground">
                    {table.table_code}
                  </p>
                  {table.status === "MERGED_CHILD" && table.parent_table_id ? (
                    <p className="text-[11px] text-muted-foreground">
                      Routes to host table
                    </p>
                  ) : null}
                </div>
                <StatusPill
                  label={table.status.replaceAll("_", " ")}
                  tone={
                    table.status.includes("MERGED")
                      ? "violet"
                      : table.status === "PRE_BOOKED"
                        ? "ruby"
                        : table.status === "OCCUPIED"
                          ? "emerald"
                          : "muted"
                  }
                />
              </li>
            ))}
          </ul>
          {mergeNote ? (
            <p className="mt-4 text-sm text-muted-foreground">{mergeNote}</p>
          ) : null}
        </AdminSection>
      </div>
    </AdminShell>
  );
}
