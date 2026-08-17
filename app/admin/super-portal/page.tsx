"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";

/**
 * Internal Super Admin unlock — no emails/passwords rendered.
 * Requires SUPER_ADMIN_PORTAL_KEY in the environment.
 */
export default function SuperAdminPortalPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maitab-portal-key": key,
        },
        body: JSON.stringify({ role: "SUPER_ADMIN", portalKey: key }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        home?: string;
      };
      if (!data.ok) {
        setError("Access denied.");
        return;
      }
      router.replace(data.home ?? "/admin/super");
    } catch {
      setError("Unable to reach unlock service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-secondary p-8 backdrop-blur-2xl">
        <MaiTabLogo variant="IconOnly" className="h-10 w-10" />
        <h1 className="mt-5 font-display text-2xl font-bold">Secure access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted console. Enter the environment portal key to continue.
        </p>
        <input
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Portal key"
          className="mt-6 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {error ? (
          <p className="mt-3 text-sm text-accent-ruby">{error}</p>
        ) : null}
        <button
          type="button"
          disabled={busy || key.length < 8}
          onClick={() => void unlock()}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent-violet text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Verifying…" : "Unlock"}
        </button>
      </div>
    </div>
  );
}
