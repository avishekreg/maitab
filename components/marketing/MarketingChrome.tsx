"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { FooterAndroidQr } from "@/components/marketing/FooterAndroidQr";
import { FooterAppStoreBadges } from "@/components/marketing/FooterAppStoreBadges";

export { MarketingHeader } from "@/components/landing/header";

const PLATFORM_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#system", label: "System" },
  { href: "#experience", label: "Experience" },
  { href: "#features", label: "Features" },
  { href: "#safety", label: "Safety" },
  { href: "#pricing", label: "Pricing" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Login" },
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

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0c0c0f] text-[#E7E5E4]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_-10%,rgba(139,92,246,0.14),transparent_55%),radial-gradient(700px_360px_at_90%_0%,rgba(6,182,212,0.10),transparent_50%)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1.1fr_0.85fr_1fr]">
        <div>
          <BrandLockup />
          <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-200">
            Zero-Hardware Nightlife OS & Cryptographic Bar Tab Infrastructure.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-slate-300/70">
            Designed, Built & Operated by{" "}
            <span className="font-medium text-slate-200">Syncra Systems LLP</span>.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/60">
            Get the app
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <FooterAndroidQr size={112} />
            <FooterAppStoreBadges stacked align="left" hideHeading />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/60">
            Platform
          </p>
          <ul className="mt-4 space-y-2.5 text-base text-slate-200/85">
            {PLATFORM_LINKS.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link
                    href={item.href}
                    className="transition hover:text-[#FFFFFF]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="transition hover:text-[#FFFFFF]"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/60">
            Legal & Governance
          </p>
          <ul className="mt-4 space-y-2.5 text-base text-slate-200/85">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition hover:text-[#FFFFFF]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-300/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 mAITab. Designed, Built & Operated by Syncra Systems LLP.</p>
          <p>
            Zero-Hardware Nightlife OS & Cryptographic Bar Tab Infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}
