"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { TelemetryCameraCapture } from "@/components/saarthi/TelemetryCameraCapture";
import {
  DEMO_SAARTHI_DRIVER_ID,
  SAARTHI_BRAND,
} from "@/lib/saarthi/types";
import type { SaarthiDriver, SaarthiTrip } from "@/lib/saarthi/types";
import type { EnrollmentPhoto } from "@/lib/saarthi/enrollment";
import { cn, formatINR } from "@/lib/utils";

const STATUS_STEPS = [
  "REQUESTED",
  "ACCEPTED",
  "ARRIVED_AT_VALET",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

const STATUS_LABEL: Record<(typeof STATUS_STEPS)[number], string> = {
  REQUESTED: "Assigned",
  ACCEPTED: "Accepted",
  ARRIVED_AT_VALET: "Arrived",
  IN_PROGRESS: "En Route",
  COMPLETED: "Completed",
};

function TripProgress({ status }: { status: string }) {
  const idx = Math.max(
    0,
    STATUS_STEPS.findIndex((s) => s === status)
  );
  return (
    <div className="mt-3 flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const active = i <= idx;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-lux ease-lux",
                active
                  ? "bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.35)]"
                  : "bg-zinc-800"
              )}
              title={STATUS_LABEL[step]}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function SaarthiDriverPortal() {
  const [driver, setDriver] = useState<SaarthiDriver | null>(null);
  const [trips, setTrips] = useState<SaarthiTrip[]>([]);
  const [otp, setOtp] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [faceOk, setFaceOk] = useState(false);
  const [faceNote, setFaceNote] = useState<string | null>(null);
  const [enrollmentPhone, setEnrollmentPhone] = useState("");

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

  async function verifyFace(photo: EnrollmentPhoto) {
    setFaceNote(null);
    const res = await fetch("/api/saarthi/drivers/verify-face", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: enrollmentPhone || driver?.phone,
        live_selfie_data_url: photo.data_url,
        live_telemetry: {
          lat: photo.telemetry.lat,
          lng: photo.telemetry.lng,
          captured_at: photo.telemetry.captured_at,
        },
      }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      match?: boolean;
      score?: number;
      reason?: string;
      error?: string;
      method?: string;
    };
    if (!json.ok || !json.match) {
      setFaceOk(false);
      setFaceNote(json.reason || json.error || "Face verify failed");
      return;
    }
    setFaceOk(true);
    setFaceNote(
      `Identity OK · score ${((json.score ?? 0) * 100).toFixed(0)}% · ${json.method}`
    );
  }

  async function act(id: string, action: string) {
    if (action === "start" && !faceOk) {
      setNote("Complete live face verify before starting the trip");
      return;
    }
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
      <header className="border-b border-white/10 bg-zinc-950/80 px-4 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <MaiTabLogo variant="FullLogoWithText" onDark className="h-8 w-auto" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
            Companion
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl animate-lux-enter px-4 py-8">
        <h1 className="font-display text-3xl leading-tight">{SAARTHI_BRAND}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Personal Chauffeur Service • Safe Night Transit
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/saarthi/driver-signup"
            className="inline-flex rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-100"
          >
            New driver enrollment →
          </Link>
        </div>

        {driver ? (
          <div className="lux-glass-dark lux-sheen mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
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
              className={cn(
                "lux-interactive lux-focus-ring rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-lux ease-lux",
                driver.is_online
                  ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.2)]"
                  : "border border-white/15 text-zinc-400"
              )}
            >
              {driver.is_online ? "Online" : "Offline"}
            </button>
          </div>
        ) : null}

        {note ? <p className="mt-4 text-sm text-rose-400">{note}</p> : null}

        <div className="lux-glass-dark mt-6 space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
            Trip-start face verify
          </p>
          <p className="text-sm text-zinc-400">
            Live selfie with GPS/time must match the enrolled mAISaarthi driver
            before Start trip.
          </p>
          <input
            value={enrollmentPhone}
            onChange={(e) => setEnrollmentPhone(e.target.value)}
            placeholder="Enrollment phone (if not demo driver)"
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
          />
          <TelemetryCameraCapture
            kind="SELFIE"
            label="Live selfie for this shift"
            facingMode="user"
            onCaptured={(p) => void verifyFace(p)}
          />
          {faceNote ? (
            <p
              className={cn(
                "text-sm",
                faceOk ? "text-emerald-300" : "text-rose-400"
              )}
            >
              {faceNote}
            </p>
          ) : null}
        </div>

        <div className="mt-8 space-y-4">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="lux-glass-dark lux-sheen lux-interactive p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                {STATUS_LABEL[trip.trip_status as keyof typeof STATUS_LABEL] ??
                  trip.trip_status.replaceAll("_", " ")}
              </p>
              <TripProgress status={trip.trip_status} />
              <p className="mt-3 text-white">
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
                    className="lux-interactive lux-focus-ring rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-zinc-950 shadow-glow-cyan"
                  >
                    Accept
                  </button>
                ) : null}
                {trip.trip_status === "ACCEPTED" ? (
                  <button
                    type="button"
                    onClick={() => void act(trip.id, "arrive")}
                    className="lux-interactive lux-focus-ring rounded-lg border border-white/20 px-3 py-2 text-xs"
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
                      className="w-24 rounded-lg border border-cyan-500/30 bg-black px-2 py-2 text-center font-mono tracking-[0.3em] shadow-[0_0_0_1px_rgba(6,182,212,0.15)] outline-none focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(6,182,212,0.25)]"
                    />
                    <button
                      type="button"
                      onClick={() => void act(trip.id, "start")}
                      className="lux-interactive lux-focus-ring rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950"
                    >
                      Start trip
                    </button>
                  </div>
                ) : null}
                {trip.trip_status === "IN_PROGRESS" ? (
                  <button
                    type="button"
                    onClick={() => void act(trip.id, "complete")}
                    className="lux-interactive lux-focus-ring rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950"
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
