"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DEMO_CLUB } from "@/lib/demo/data";
import { CAR_CATALOG, SAARTHI_BASE_FARE } from "@/lib/saarthi/types";
import type { SaarthiTrip, TransmissionType } from "@/lib/saarthi/types";
import { useSessionStore } from "@/lib/store/session-store";
import { formatINR } from "@/lib/utils";

export function SaarthiBookingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useSessionStore((s) => s.user);
  const [brand, setBrand] = useState(CAR_CATALOG[0].brand);
  const models = useMemo(
    () => CAR_CATALOG.find((c) => c.brand === brand)?.models ?? [],
    [brand]
  );
  const [model, setModel] = useState(models[0]?.name ?? "");
  const transmission: TransmissionType =
    models.find((m) => m.name === model)?.transmission ?? "AUTOMATIC";
  const [drop, setDrop] = useState("");
  const [busy, setBusy] = useState(false);
  const [trip, setTrip] = useState<SaarthiTrip | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          car_brand: brand,
          car_model: model,
          transmission_type: transmission,
          pickup_venue_name: DEMO_CLUB.name,
          drop_address: drop,
        }),
      });
      const json = (await res.json()) as { ok: boolean; trip?: SaarthiTrip; error?: string };
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  MaiSaarthi
                </p>
                <h2 id="saarthi-title" className="mt-1 font-display text-2xl text-white">
                  Verified chauffeur
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Police-verified drivers · luxury transmission match · valet handshake OTP
                </p>
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
              {trip ? (
                <div className="space-y-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {trip.trip_status.replaceAll("_", " ")}
                  </p>
                  <p className="text-lg text-white">
                    {trip.car_brand} {trip.car_model}
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
                      {trip.trip_otp}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-300">
                    Fare {formatINR(trip.total_fare)}
                    {trip.surge_fare > 0 ? ` · includes late-night surge ${formatINR(trip.surge_fare)}` : ""}
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void book();
                  }}
                >
                  <label className="block text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Car brand
                    <select
                      value={brand}
                      onChange={(e) => {
                        const next = e.target.value;
                        setBrand(next);
                        const first =
                          CAR_CATALOG.find((c) => c.brand === next)?.models[0]?.name ?? "";
                        setModel(first);
                      }}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                    >
                      {CAR_CATALOG.map((c) => (
                        <option key={c.brand}>{c.brand}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Model
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                    >
                      {models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} · {m.transmission.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs text-cyan-300/80">
                    Transmission lock · {transmission.replace("_", " ")}
                  </p>
                  <label className="block text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Drop address
                    <textarea
                      required
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      rows={3}
                      placeholder="Residence / hotel / next venue"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
                    />
                  </label>
                  <p className="text-sm text-zinc-400">
                    Base dispatch {formatINR(SAARTHI_BASE_FARE)} · late-night surge may apply
                  </p>
                  {error ? <p className="text-sm text-rose-400">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={busy || drop.trim().length < 6}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                  >
                    {busy ? "Dispatching…" : "Confirm chauffeur"}
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
