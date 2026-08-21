"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { ComplianceCapsule } from "@/components/landing/ComplianceCapsule";
import { FooterAndroidQr } from "@/components/marketing/FooterAndroidQr";
import { FooterAppStoreBadges } from "@/components/marketing/FooterAppStoreBadges";

const PLATFORM_LINKS = [
  { href: "/#problem", label: "Problem" },
  { href: "/#system", label: "System" },
  { href: "/#engines", label: "Engines" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features-section", label: "Features" },
  { href: "/#safety", label: "Safety" },
  { href: "/#pricing-section", label: "Pricing" },
  { href: "/#compare", label: "Compare" },
  { href: "/#faq", label: "FAQ" },
  { href: "/login", label: "Login" },
  { href: "/saarthi/driver-signup", label: "Drive with mAISaarthi" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms of Usage" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  {
    href: "/legal/merchant-refund",
    label: "Merchant Refund & Dispute Policy",
  },
  { href: "/legal/security", label: "Security Disclaimer" },
] as const;

/** Landing footer — static compliance capsule + demo roles launcher + branding. */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-zinc-950 text-zinc-300">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_-10%,rgba(139,92,246,0.14),transparent_55%),radial-gradient(700px_360px_at_90%_0%,rgba(6,182,212,0.10),transparent_50%)]"
      />

      {/* Static dual compliance pill above branding */}
      <div className="relative z-10 px-4 pt-12 sm:px-6">
        <ComplianceCapsule variant="static" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1.1fr_0.85fr_1fr]">
        <div>
          <BrandLockup />
          <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-300">
            Zero-Hardware Nightlife OS & Cryptographic Bar Tab Infrastructure.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Designed, Built & Operated by{" "}
            <span className="font-medium text-zinc-200">Syncra Systems LLP</span>.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Get the app
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <FooterAndroidQr size={112} />
            <FooterAppStoreBadges stacked align="left" hideHeading />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Platform
          </p>
          <ul className="mt-4 space-y-2.5 text-base text-zinc-300">
            {PLATFORM_LINKS.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Legal & Governance
          </p>
          <ul className="mt-4 space-y-2.5 text-base text-zinc-300">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Demo roles + driver signup launchers above copyright */}
      <div className="relative border-t border-white/10 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-500/15 px-5 py-3.5 text-sm font-bold text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.2)] transition hover:bg-violet-500/25 sm:w-auto"
          >
            <Rocket className="h-4 w-4" aria-hidden />
            Try Venue Demo Roles
          </Link>
          <Link
            href="/saarthi/driver-signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/45 bg-cyan-500/15 px-5 py-3.5 text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.18)] transition hover:bg-cyan-500/25 sm:w-auto"
          >
            Drive with mAISaarthi — sign up
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 mAITab. Designed, Built & Operated by Syncra Systems LLP.</p>
          <p>
            Zero-Hardware Nightlife OS & Cryptographic Bar Tab Infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer as MarketingFooter };
export default Footer;
