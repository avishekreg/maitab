"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DEMO_CLUB } from "@/lib/demo/data";
import {
  SAARTHI_BASE_FARE,
  SAARTHI_BRAND,
  SAARTHI_TAGLINE,
  TRANSMISSION_PILLS,
  VEHICLE_SEGMENTS,
  type TransmissionType,
  type VehicleSegment,
  type SaarthiTrip,
} from "@/lib/saarthi/types";
import { useSessionStore } from "@/lib/store/session-store";
import { cn, formatINR } from "@/lib/utils";

export function SaarthiBookingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const [segment, setSegment] = useState<VehicleSegment>("SEDAN_HATCH");
  const [transmission, setTransmission] = useState<TransmissionType>("AUTOMATIC");
  const [carDetails, setCarDetails] = useState("");
  const [drop, setDrop] = useState("");
  const [busy, setBusy] = useState(false);
  const [trip, setTrip] = useState<SaarthiTrip | null>(null);
  const [error, setError] = useState<string | null>(null);

  const segmentLabel = useMemo(
    () => VEHICLE_SEGMENTS.find((s) => s.id === segment)?.label ?? segment,
    [segment]
  );

  async function book() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/saarthi/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: user.id,
          guest_name: user.full_name,
          guest_phone: user.phone_number,
          venue_id: DEMO_CLUB.id,
          car_brand: segmentLabel,
          car_model: carDetails.trim() || "Valet identification pending",
          transmission_type: transmission,
          pickup_venue_name: `${DEMO_CLUB.name} (Valet Counter)`,
          drop_address: drop,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        trip?: SaarthiTrip;
        error?: string;
      };
      if (!json.ok || !json.trip) {
        setError(json.error || "Unable to dispatch a chauffeur");
        return;
      }
      setTrip(json.trip);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            aria-label="Close chauffeur booking"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="saarthi-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-cyan-500/20 bg-zinc-950/95 shadow-[-24px_0_80px_rgba(6,182,212,0.12)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2
                  id="saarthi-title"
                  className="font-display text-2xl tracking-tight text-white"
                >
                  <span className="text-white">m</span>
                  <span className="text-cyan-300">AI</span>
                  <span className="text-white"> Saarthi</span>
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{SAARTHI_TAGLINE}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 p-2 text-white/80 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                📍 Pickup: {DEMO_CLUB.name} (Valet Counter) • GPS Geofenced
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                4 Police-Verified Drivers Active Nearby • Avg ETA ~8 Mins
              </div>

              {trip ? (
                <div className="mt-6 space-y-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {trip.trip_status.replaceAll("_", " ")}
                  </p>
                  <p className="text-lg text-white">
                    {trip.car_brand}
                    {trip.car_model !== "Valet identification pending"
                      ? ` · ${trip.car_model}`
                      : ""}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Pickup · {trip.pickup_venue_name}
                    <br />
                    Drop · {trip.drop_address}
                  </p>
                  <div className="rounded-xl border border-amber-500/30 bg-black/40 px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
                      Handshake OTP
                    </p>
                    <p className="mt-1 font-mono text-3xl tracking-[0.35em] text-white">
                      #{trip.trip_otp}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-300">
                    {formatINR(SAARTHI_BASE_FARE)} Base Night Chauffeur Fare
                  </p>
                </div>
              ) : (
                <form
                  className="mt-6 space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void book();
                  }}
                >
                  <fieldset>
                    <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Vehicle segment
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {VEHICLE_SEGMENTS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSegment(item.id)}
                          className={cn(
                            "rounded-full border px-3 py-2 text-xs font-medium transition",
                            segment === item.id
                              ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Transmission & drivetrain
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {TRANSMISSION_PILLS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTransmission(item.id)}
                          className={cn(
                            "rounded-full border px-3 py-2 text-xs font-medium transition",
                            transmission === item.id
                              ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Car details (optional)
                    <input
                      value={carDetails}
                      onChange={(e) => setCarDetails(e.target.value)}
                      placeholder="Car Details (e.g., Black Mercedes GLA / WB-02-XXXX)"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white placeholder:text-zinc-600"
                    />
                  </label>

                  <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Drop address
                    <textarea
                      required
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      rows={3}
                      placeholder="Residence / hotel / next venue"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white placeholder:text-zinc-600"
                    />
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300">
                      🛡️ Police Verified
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300">
                      📸 4-Angle Pre-Trip Photo Inspection
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300">
                      🔢 Handshake OTP
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatINR(SAARTHI_BASE_FARE)} Base Night Chauffeur Fare
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Inclusive of Valet Handover & Safety Protocol
                    </p>
                  </div>

                  {error ? <p className="text-sm text-rose-400">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={busy || drop.trim().length < 6}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                  >
                    {busy
                      ? "Dispatching…"
                      : `Confirm ${SAARTHI_BRAND} Chauffeur ➔`}
                  </button>
                </form>
              )}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export default SaarthiBookingDrawer;
