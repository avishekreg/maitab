"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

type NightRow = {
  id: string;
  club_name: string;
  table_code: string;
  spend_amount: number;
  status: string;
  saarthi_trip_id: string | null;
  night_at: string;
};

type ProfilePayload = {
  ok: boolean;
  summary?: {
    lifetime_spend: number;
    lifetime_visits: number;
    loyalty_points: number;
    vip_tier: string;
    passkey_enrolled: boolean;
    saarthi_rides: number;
  };
  history?: NightRow[];
  user?: { full_name: string; vip_tier?: string };
};

function weekdayLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Personal night history + lifetime wallet for Layer 1 guest identity. */
export function NightHistoryDrawer() {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    void fetch("/api/guest/profile")
      .then((r) => r.json())
      .then((json: ProfilePayload) => setData(json))
      .catch(() => undefined);
  }, []);

  if (!data?.ok || !data.summary) return null;
  const { summary, history = [], user } = data;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <History className="h-4 w-4 text-violet-300" aria-hidden />
          Your nights
        </span>
        <span className="text-xs text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Lifetime
              </p>
              <p className="mt-1 font-display text-lg font-bold text-amber-300">
                {formatINR(summary.lifetime_spend)}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Visits
              </p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {summary.lifetime_visits}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Loyalty
              </p>
              <p className="mt-1 font-display text-lg font-bold text-cyan-300">
                {summary.loyalty_points}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3 w-3" aria-hidden />
              {user?.vip_tier || summary.vip_tier} VIP
            </span>
            {summary.passkey_enrolled ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Biometric on
              </span>
            ) : null}
          </div>

          <ul className="space-y-2">
            {history.map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-3"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {weekdayLabel(n.night_at)} at {n.club_name}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Table {n.table_code} — {formatINR(n.spend_amount)}{" "}
                  {n.status === "SETTLED" ? "Settled" : n.status}
                </p>
                {n.saarthi_trip_id ? (
                  <Link
                    href="/saarthi"
                    className="mt-2 inline-block text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    mAISaarthi ride receipt →
                  </Link>
                ) : null}
              </li>
            ))}
            {history.length === 0 ? (
              <li className="text-sm text-zinc-500">
                No past nights yet — scan a table QR to start one.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
