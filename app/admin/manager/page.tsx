"use client";

import { useMemo, useState } from "react";
import {
  AdminSection,
  AdminShell,
  KpiStrip,
} from "@/components/admin/AdminShell";
import { StaffCrudAndCaptainPanel } from "@/components/admin/StaffCrudAndCaptainPanel";
import { ComplianceBanner } from "@/components/compliance/ComplianceBanner";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { managerDrill } from "@/lib/admin/kpi-drills";
import { DEMO_BAR_COUNTERS } from "@/lib/kds/routing";
import { selectActiveVenue, useVenueStore } from "@/lib/store/venue-store";
import {
  DEMO_BARTENDER_SHIFTS,
  DEMO_CLUB_ZONES,
  DEMO_WAITER_SHIFTS,
  assignBartenderCounter,
  assignWaiterZone,
} from "@/lib/waiter/allocation";
import { cn } from "@/lib/utils";

export default function FloorManagerPage() {
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const venue = useVenueStore(selectActiveVenue);
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  // Captain vs manager: cookie role isn't available client-side here;
  // both get staff CRUD; captain-style override panel always shown for rush.
  const panelMode = "captain" as const;

  const zones = useMemo(
    () => DEMO_CLUB_ZONES.filter((z) => z.venue_id === activeVenueId),
    [activeVenueId, tick]
  );
  const waiters = useMemo(
    () => DEMO_WAITER_SHIFTS.filter((s) => s.venue_id === activeVenueId),
    [activeVenueId, tick]
  );
  const bartenders = useMemo(
    () => DEMO_BARTENDER_SHIFTS.filter((s) => s.venue_id === activeVenueId),
    [activeVenueId, tick]
  );
  const counters = useMemo(
    () =>
      DEMO_BAR_COUNTERS.filter(
        (c) => c.venue_id === activeVenueId && c.active_status
      ),
    [activeVenueId]
  );

  async function persistShift(body: Record<string, unknown>) {
    await fetch("/api/staff/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
  }

  function onWaiterZone(waiterId: string, zoneId: string) {
    const next = assignWaiterZone(waiterId, zoneId, true);
    setTick((t) => t + 1);
    if (!next) return;
    setNote(`${next.waiter_name} → ${zones.find((z) => z.id === zoneId)?.zone_name ?? zoneId}`);
    void persistShift({
      venueId: activeVenueId,
      kind: "WAITER_ZONE",
      staffId: waiterId,
      staffName: next.waiter_name,
      zoneId,
      active: true,
    });
  }

  function onBartenderCounter(bartenderId: string, counterId: string) {
    const next = assignBartenderCounter(bartenderId, counterId, true);
    setTick((t) => t + 1);
    if (!next) return;
    const counter = counters.find((c) => c.id === counterId);
    setNote(`${next.bartender_name} → ${counter?.counter_name ?? counterId}`);
    void persistShift({
      venueId: activeVenueId,
      kind: "BARTENDER_COUNTER",
      staffId: bartenderId,
      staffName: next.bartender_name,
      counterId,
      active: true,
    });
  }

  function toggleWaiter(waiterId: string) {
    const current = waiters.find((w) => w.waiter_id === waiterId);
    if (!current) return;
    assignWaiterZone(waiterId, current.assigned_zone_id, !current.active_status);
    setTick((t) => t + 1);
  }

  return (
    <AdminShell
      role="FLOOR_MANAGER"
      title="Floor Manager"
      subtitle={`${venue.short_name} — map waiters to zones and staff to bar counters before / during the shift.`}
    >
      <div className="space-y-6">
        <KpiStrip
          items={[
            {
              id: "active-tables",
              label: "Active tables",
              value: "3",
              drill: managerDrill("active-tables", {
                activeWaiters: waiters.filter((w) => w.active_status).length,
                zoneCount: zones.length || 2,
                barCount: counters.length,
              })!,
            },
            {
              id: "service-calls",
              label: "Pending service calls",
              value: "3",
              tone: "ruby",
              drill: managerDrill("service-calls", {
                activeWaiters: waiters.filter((w) => w.active_status).length,
                zoneCount: zones.length || 2,
                barCount: counters.length,
              })!,
            },
            {
              id: "staff-duty",
              label: "Staff on-duty",
              value: String(
                waiters.filter((w) => w.active_status).length +
                  bartenders.filter((b) => b.active_status).length
              ),
              drill: managerDrill("staff-duty", {
                activeWaiters: waiters.filter((w) => w.active_status).length,
                zoneCount: zones.length || 2,
                barCount: counters.length,
              })!,
            },
          ]}
        />

        {note ? (
          <p className="rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-4 py-2 text-sm text-foreground">
            {note}
          </p>
        ) : null}

        <ComplianceBanner venueId={activeVenueId} />

        <StaffCrudAndCaptainPanel venueId={activeVenueId} mode={panelMode} />

        <AdminSection
          title="Waiter → Floor Zone"
          description="Assign each waiter to Main Floor or VIP Lounge (table ranges). Routing updates on next order."
        >
          {waiters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No waiter roster for this venue yet — switch back to Neon District
              Main for the demo roster.
            </p>
          ) : (
            <ul className="space-y-3">
              {waiters.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {w.waiter_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {zones.find((z) => z.id === w.assigned_zone_id)
                        ?.zone_name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={w.active_status ? "ON SHIFT" : "OFF"}
                      tone={w.active_status ? "emerald" : "muted"}
                    />
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      value={w.assigned_zone_id}
                      onChange={(e) =>
                        onWaiterZone(w.waiter_id, e.target.value)
                      }
                    >
                      {(zones.length
                        ? zones
                        : DEMO_CLUB_ZONES.filter(
                            (z) => z.venue_id === w.venue_id
                          )
                      ).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.zone_name}
                        </option>
                      ))}
                    </select>
                    <NeonButton
                      type="button"
                      size="sm"
                      tone="ghost"
                      onClick={() => toggleWaiter(w.waiter_id)}
                    >
                      {w.active_status ? "Clock out" : "Clock in"}
                    </NeonButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdminSection
          title="Staff → Bar Counter"
          description="Quick-switch bartenders (and floor leads) onto Main Bar Counter 1 or VIP Bar Counter 2."
        >
          <ul className="space-y-3">
            {bartenders.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {b.bartender_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Bartender</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {counters.map((c) => {
                    const active = b.assigned_counter_id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          onBartenderCounter(b.bartender_id, c.id)
                        }
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-sm transition",
                          active
                            ? "border-accent-gold bg-accent-gold/15 text-accent-gold"
                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        )}
                      >
                        <span className="block font-semibold">
                          {c.counter_name}
                        </span>
                        <span className="text-[11px] opacity-80">
                          {c.is_vip ? "VIP KDS stream" : "Main KDS stream"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>
    </AdminShell>
  );
}
