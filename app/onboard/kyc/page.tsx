"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { NeonButton } from "@/components/ui/NeonButton";

function KycForm() {
  const router = useRouter();
  const params = useSearchParams();
  const clubId = params.get("club") || "";
  const email = params.get("email") || "";
  const [liquorUrl, setLiquorUrl] = useState("");
  const [liquorExpiry, setLiquorExpiry] = useState("");
  const [fssaiUrl, setFssaiUrl] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [gstin, setGstin] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/ops/compliance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venue_id: clubId || undefined,
        liquor_license_url: liquorUrl || null,
        liquor_license_expiry: liquorExpiry || null,
        fssai_license_url: fssaiUrl || null,
        fssai_license_expiry: fssaiExpiry || null,
        gstin: gstin || null,
      }),
    });
    const data = (await res.json()) as { ok: boolean };
    setBusy(false);
    if (!data.ok) {
      setNote("Could not save licenses.");
      return;
    }
    setNote("KYC saved. Opening Club Admin…");
    router.push("/admin/club");
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-secondary p-8">
      <MaiTabLogo variant="IconOnly" className="h-10 w-10" />
      <h1 className="mt-5 font-display text-2xl font-bold">
        KYC · License upload
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Workspace for {email || "new Club Admin"}. Upload liquor & FSSAI
        documents with expiry dates.
      </p>

      <div className="mt-6 space-y-3">
        <label className="block text-sm">
          Liquor license URL
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
            value={liquorUrl}
            onChange={(e) => setLiquorUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-sm">
          Liquor expiry
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
            value={liquorExpiry}
            onChange={(e) => setLiquorExpiry(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          FSSAI license URL
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
            value={fssaiUrl}
            onChange={(e) => setFssaiUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-sm">
          FSSAI expiry
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
            value={fssaiExpiry}
            onChange={(e) => setFssaiExpiry(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          GSTIN
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
          />
        </label>
      </div>

      {note ? (
        <p className="mt-4 text-sm text-accent-emerald">{note}</p>
      ) : null}

      <NeonButton
        className="mt-6 w-full"
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy ? "Saving…" : "Submit & open Club Admin"}
      </NeonButton>
    </div>
  );
}

export default function OnboardKycPage() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <KycForm />
      </Suspense>
    </div>
  );
}
