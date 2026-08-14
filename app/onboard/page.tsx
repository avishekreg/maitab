"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/MarketingChrome";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { NeonButton } from "@/components/ui/NeonButton";
import { cn, formatINR } from "@/lib/utils";

type Plan = "STARTER" | "PRO" | "ENTERPRISE";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  gmv: string;
  blurb: string;
  highlights: string[];
}[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: formatINR(14999) + "/mo",
    gmv: "+ 1.5% GMV",
    blurb: "Single venue — gate, tab, KDS, and AutoPay.",
    highlights: ["1 venue", "Floor QR & Member Pass", "Basic flash promos"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: formatINR(29999) + "/mo",
    gmv: "+ 1% GMV",
    blurb: "Multi-venue portfolio with floor routing.",
    highlights: [
      "Multi-venue switcher",
      "Waiter / bar counter routing",
      "Geo flash campaigns",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Group",
    price: "Annual SLA",
    gmv: "Custom settlement",
    blurb: "Group owners with dedicated onboarding & SLA.",
    highlights: ["Annual contract", "Dedicated CSM", "Custom integrations"],
  },
];

export default function OnboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("PRO");
  const [venueName, setVenueName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          venue_name: venueName,
          admin_name: adminName,
          admin_email: adminEmail,
          phone,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        redirect?: string;
        workspace?: { club_id: string };
      };
      if (!data.ok || !data.redirect) {
        setError(data.reason ?? "Checkout failed");
        return;
      }
      // Auto-provision Club Admin demo session for the new workspace.
      await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CLUB_ADMIN" }),
      }).catch(() => null);
      router.push(data.redirect);
    } catch {
      setError("Unable to capture payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0E14] text-[#F8FAFC]">
      <MarketingHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
        <MaiTabLogo
          variant="FullLogoWithText"
          onDark
          className="mb-8 h-10 w-auto min-w-[11rem]"
        />
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Self-serve B2B onboarding
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#E2E8F0]">
          Choose a plan, capture settlement, and auto-provision your Club Admin
          workspace — then upload KYC licenses to go live.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={cn(
                "rounded-2xl border p-5 text-left transition",
                plan === p.id
                  ? "border-[#A855F7] bg-[#A855F7]/10 ring-1 ring-[#A855F7]/40"
                  : "border-white/10 bg-[#12151A] hover:border-white/25"
              )}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#A855F7]">
                {p.name}
              </p>
              <p className="mt-2 font-display text-2xl font-bold">{p.price}</p>
              <p className="text-sm text-amber-300">{p.gmv}</p>
              <p className="mt-3 text-sm text-[#E2E8F0]">{p.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-[#94A3B8]">
                {p.highlights.map((h) => (
                  <li key={h}>· {h}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#12151A] p-6">
          <h2 className="font-display text-xl font-bold">Workspace details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Venue name
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14] px-3"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Neon District Main"
              />
            </label>
            <label className="block text-sm">
              Club Admin name
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14] px-3"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Aisha Khan"
              />
            </label>
            <label className="block text-sm">
              Admin email
              <input
                type="email"
                className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14] px-3"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@venue.com"
              />
            </label>
            <label className="block text-sm">
              Phone
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14] px-3"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91…"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-rose-400">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <NeonButton
              tone="violet"
              disabled={
                busy || !venueName || !adminName || !adminEmail.includes("@")
              }
              onClick={() => void checkout()}
            >
              {busy
                ? "Capturing payment…"
                : plan === "ENTERPRISE"
                  ? "Request Enterprise SLA"
                  : "Pay & provision workspace"}
            </NeonButton>
            <Link href="/login" className="text-sm text-[#94A3B8] underline">
              Already have a demo login?
            </Link>
          </div>
          <p className="mt-3 text-xs text-[#64748B]">
            Settlement uses the Automated Direct-Settlement Gateway. After
            capture you upload liquor / FSSAI licenses on the KYC step.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
