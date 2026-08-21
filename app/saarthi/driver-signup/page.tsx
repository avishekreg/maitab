"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { TelemetryCameraCapture } from "@/components/saarthi/TelemetryCameraCapture";
import {
  isValidAadhaar,
  normalizeAadhaar,
  REQUIRED_ENROLLMENT_PHOTO_KINDS,
  type EnrollmentPhoto,
} from "@/lib/saarthi/enrollment";
import { SAARTHI_BRAND, SAARTHI_TAGLINE } from "@/lib/saarthi/types";

export default function MaiSaarthiDriverSignupPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [dlExpiry, setDlExpiry] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [photos, setPhotos] = useState<
    Partial<Record<EnrollmentPhoto["kind"], EnrollmentPhoto>>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const photosReady = REQUIRED_ENROLLMENT_PHOTO_KINDS.every((k) => photos[k]);

  const ready = useMemo(
    () =>
      Boolean(
        fullName.trim() &&
          phone.trim() &&
          dlNumber.trim() &&
          dlExpiry &&
          isValidAadhaar(aadhaar) &&
          photosReady
      ),
    [fullName, phone, dlNumber, dlExpiry, aadhaar, photosReady]
  );

  function setPhoto(photo: EnrollmentPhoto) {
    setPhotos((prev) => ({ ...prev, [photo.kind]: photo }));
  }

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const list = REQUIRED_ENROLLMENT_PHOTO_KINDS.map((k) => photos[k]!);

      const res = await fetch("/api/saarthi/drivers/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email: email || null,
          dl_number: dlNumber,
          dl_expiry: dlExpiry,
          aadhaar_number: normalizeAadhaar(aadhaar),
          photos: list,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        enrollment?: { id: string };
      };
      if (!json.ok || !json.enrollment) {
        setError(json.error || "Enrollment failed");
        return;
      }
      setDoneId(json.enrollment.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <MaiTabLogo variant="FullLogoWithText" onDark className="h-8 w-auto" />
          <Link
            href="/saarthi"
            className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
          >
            Driver portal →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
          Driver enrollment
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {SAARTHI_BRAND} signup
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {SAARTHI_TAGLINE}. Mandatory KYC: DL (front &amp; back), Aadhaar (front
          &amp; back), police clearance certificate, and enrollment selfie —
          each with live GPS and timestamp. Super Admin verifies before you go
          live; every ride start face-matches against this enrollment.
        </p>

        {doneId ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
            <p className="text-lg font-semibold text-emerald-200">
              Enrollment submitted
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              ID <span className="font-mono">{doneId}</span> · status PENDING
              until Super Admin verifies DL, Aadhaar, and police clearance.
            </p>
            <Link
              href="/saarthi"
              className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-zinc-950"
            >
              Open driver companion
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-zinc-400">Full legal name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Phone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Email (optional)</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Aadhaar number (12 digits)</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 font-mono tracking-wider text-white outline-none focus:border-cyan-500/50"
                />
                {aadhaar.trim() && !isValidAadhaar(aadhaar) ? (
                  <span className="mt-1 block text-xs text-amber-400">
                    Enter a valid 12-digit Aadhaar number
                  </span>
                ) : null}
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">DL number</span>
                <input
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 uppercase text-white outline-none focus:border-cyan-500/50"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">DL expiry</span>
                <input
                  type="date"
                  value={dlExpiry}
                  onChange={(e) => setDlExpiry(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-cyan-500/50"
                />
              </label>
            </div>

            <div>
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Mandatory document capture
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <TelemetryCameraCapture
                  kind="DL_FRONT"
                  label="Driving licence — front"
                  facingMode="environment"
                  onCaptured={setPhoto}
                />
                <TelemetryCameraCapture
                  kind="DL_BACK"
                  label="Driving licence — back"
                  facingMode="environment"
                  onCaptured={setPhoto}
                />
                <TelemetryCameraCapture
                  kind="AADHAAR_FRONT"
                  label="Aadhaar — front"
                  facingMode="environment"
                  onCaptured={setPhoto}
                />
                <TelemetryCameraCapture
                  kind="AADHAAR_BACK"
                  label="Aadhaar — back"
                  facingMode="environment"
                  onCaptured={setPhoto}
                />
                <TelemetryCameraCapture
                  kind="PCC"
                  label="Police clearance certificate"
                  facingMode="environment"
                  onCaptured={setPhoto}
                />
                <TelemetryCameraCapture
                  kind="SELFIE"
                  label="Enrollment selfie (face match)"
                  facingMode="user"
                  onCaptured={setPhoto}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="button"
              disabled={!ready || busy}
              onClick={() => void submit()}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-bold text-white disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {busy ? "Submitting…" : "Submit mAISaarthi enrollment"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
