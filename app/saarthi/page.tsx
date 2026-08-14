"use client";

import { useCallback, useEffect, useState } from "react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { DEMO_SAARTHI_DRIVER_ID } from "@/lib/saarthi/types";
import type { SaarthiDriver, SaarthiTrip } from "@/lib/saarthi/types";
import { formatINR } from "@/lib/utils";

export default function SaarthiDriverPortal() {
  const [driver, setDriver] = useState<SaarthiDriver | null>(null);
  const [trips, setTrips] = useState<SaarthiTrip[]>([]);
  const [otp, setOtp] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const dRes = await fetch("/api/saarthi/drivers");
    const dJson = (await dRes.json()) as { drivers: SaarthiDriver[] };
    const mine =
      dJson.drivers.find((d) => d.id === DEMO_SAARTHI_DRIVER_ID) ??
      dJson.drivers[0] ??
      null;
    setDriver(mine);
    const pool = ((await (await fetch("/api/saarthi/trips")).json()) as {
      trips: SaarthiTrip[];
    }).trips;
    const seen = new Set<string>();
    const next: SaarthiTrip[] = [];
    for (const t of pool) {
      if (seen.has(t.id)) continue;
      if (
        t.trip_status === "REQUESTED" ||
        t.assigned_driver_id === mine?.id
      ) {
        seen.add(t.id);
        next.push(t);
      }
    }
    setTrips(next);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [load]);

  async function toggleOnline() {
    if (!driver) return;
    await fetch("/api/saarthi/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: driver.id, is_online: !driver.is_online }),
    });
    void load();
  }

  async function act(id: string, action: string) {
    setNote(null);
    const res = await fetch("/api/saarthi/trips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action,
        driver_id: driver?.id,
        otp,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) setNote(json.error || "Action failed");
    setOtp("");
    void load();
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <MaiTabLogo variant="FullLogoWithText" onDark className="h-8 w-auto" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
            Companion
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl">MaiSaarthi</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Verified chauffeur dispatch · DL + PCC gate
        </p>

        {driver ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-white/[0.03] p-4">
            <div>
              <p className="text-lg font-semibold">{driver.full_name}</p>
              <p className="text-xs text-zinc-400">
                DL {driver.dl_number} · {driver.police_verification_status} · ★{" "}
                {driver.rating.toFixed(2)} · {driver.total_trips_completed} trips
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-cyan-300/80">
                {driver.transmission_specialties.join(" · ")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggleOnline()}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                driver.is_online
                  ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-white/15 text-zinc-400"
              }`}
            >
              {driver.is_online ? "Online" : "Offline"}
            </button>
          </div>
        ) : null}

        {note ? <p className="mt-4 text-sm text-rose-400">{note}</p> : null}

        <div className="mt-8 space-y-4">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                {trip.trip_status.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-white">
                {trip.guest_name} · {trip.car_brand} {trip.car_model}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {trip.pickup_venue_name} → {trip.drop_address}
              </p>
              <p className="mt-1 text-sm text-amber-300">{formatINR(trip.total_fare)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trip.trip_status === "REQUESTED" ? (
                  <button
                    type="button"
                    onClick={() => void act(trip.id, "accept")}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-zinc-950"
                  >
                    Accept
                  </button>
                ) : null}
                {trip.trip_status === "ACCEPTED" ? (
                  <button
                    type="button"
                    onClick={() => void act(trip.id, "arrive")}
                    className="rounded-lg border border-white/20 px-3 py-2 text-xs"
                  >
                    Arrived at valet
                  </button>
                ) : null}
                {trip.trip_status === "ARRIVED_AT_VALET" ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={4}
                      placeholder="OTP"
                      className="w-20 rounded-lg border border-white/15 bg-black px-2 py-2 text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => void act(trip.id, "start")}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950"
                    >
                      Start trip
                    </button>
                  </div>
                ) : null}
                {trip.trip_status === "IN_PROGRESS" ? (
                  <button
                    type="button"
                    onClick={() => void act(trip.id, "complete")}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950"
                  >
                    Complete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {trips.length === 0 ? (
            <p className="text-sm text-zinc-500">No live dispatches.</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
