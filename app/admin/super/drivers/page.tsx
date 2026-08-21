"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SAARTHI_BRAND } from "@/lib/saarthi/types";
import { cn } from "@/lib/utils";

type EnrollmentRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dl_number: string;
  dl_expiry: string;
  aadhaar_number: string;
  police_verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  enrolled_at: string;
  last_face_verify_at: string | null;
  last_face_verify_score: number | null;
  photos: {
    kind: string;
    data_url: string;
    telemetry: {
      captured_at: string;
      lat: number | null;
      lng: number | null;
      accuracy_m: number | null;
    };
  }[];
};

export default function SuperMaiSaarthiDriversPage() {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">(
    "PENDING"
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/saarthi/enrollments");
    const json = (await res.json()) as {
      ok: boolean;
      enrollments?: EnrollmentRow[];
      error?: string;
    };
    if (!json.ok) {
      setNote(json.error || "Failed to load enrollments");
      return;
    }
    setRows(json.enrollments ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "VERIFIED" | "REJECTED") {
    setBusyId(id);
    setNote(null);
    try {
      const res = await fetch("/api/admin/saarthi/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setNote(json.error || "Update failed");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const visible = rows.filter((r) =>
    filter === "ALL" ? true : r.police_verification_status === filter
  );

  return (
    <AdminShell role="SUPER_ADMIN" title={`${SAARTHI_BRAND} driver verification`}>
      <div className="space-y-6">
        <p className="max-w-3xl text-sm text-zinc-600">
          Review chauffeur enrollments: DL, Aadhaar, police clearance, and selfie
          with GPS/time telemetry. Approve only when documents and face identity
          look consistent.
        </p>

        <div className="flex flex-wrap gap-2">
          {(["PENDING", "VERIFIED", "REJECTED", "ALL"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
                filter === f
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {f}
              {f !== "ALL"
                ? ` (${rows.filter((r) => r.police_verification_status === f).length})`
                : ` (${rows.length})`}
            </button>
          ))}
        </div>

        {note ? <p className="text-sm text-rose-600">{note}</p> : null}

        <div className="space-y-4">
          {visible.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold text-zinc-950">
                    {row.full_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {row.phone}
                    {row.email ? ` · ${row.email}` : ""} · DL {row.dl_number} ·
                    exp {row.dl_expiry}
                  </p>
                  <p className="mt-1 font-mono text-sm text-zinc-700">
                    Aadhaar {row.aadhaar_number}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400">
                    {row.id} · enrolled {new Date(row.enrolled_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    row.police_verification_status === "PENDING" &&
                      "bg-amber-100 text-amber-800",
                    row.police_verification_status === "VERIFIED" &&
                      "bg-emerald-100 text-emerald-800",
                    row.police_verification_status === "REJECTED" &&
                      "bg-rose-100 text-rose-800"
                  )}
                >
                  {row.police_verification_status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {row.photos.map((p) => (
                  <div key={p.kind} className="overflow-hidden rounded-xl border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.data_url}
                      alt={p.kind}
                      className="h-36 w-full object-cover"
                    />
                    <div className="bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-600">
                      <p className="font-semibold uppercase tracking-wider">
                        {p.kind.replace(/_/g, " ")}
                      </p>
                      <p className="truncate font-mono">
                        {p.telemetry.captured_at}
                      </p>
                      <p className="font-mono">
                        {p.telemetry.lat?.toFixed(5)},{p.telemetry.lng?.toFixed(5)}{" "}
                        ±{Math.round(p.telemetry.accuracy_m ?? 0)}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {row.police_verification_status === "PENDING" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void setStatus(row.id, "VERIFIED")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void setStatus(row.id, "REJECTED")}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              ) : null}
            </article>
          ))}

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
              No {filter === "ALL" ? "" : filter.toLowerCase() + " "}enrollments
              yet. Drivers sign up at /saarthi/driver-signup.
            </p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
