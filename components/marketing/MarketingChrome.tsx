"use client";

import Link from "next/link";
import { useState } from "react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#pricing", label: "Pricing" },
  { href: "#features", label: "Features" },
  { href: "#experience", label: "Experience" },
];

/**
 * Permanent frosted dark sticky header — white chrome stays sharp
 * over the hero and light sections alike (no scroll contrast flip).
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#12151A]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          onClick={() => setOpen(false)}
        >
          <MaiTabLogo
            variant="FullLogoWithText"
            onDark
            className="h-8 w-auto min-w-[10.5rem] sm:min-w-[12rem]"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-2 font-sans text-sm font-medium tracking-normal text-[#FFFFFF]/85 transition hover:bg-white/10 hover:text-[#FFFFFF]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-white/20 px-3.5 py-2 font-sans text-sm font-semibold tracking-normal text-[#FFFFFF] transition hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/onboard"
            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] px-4 font-sans text-sm font-semibold tracking-normal text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/25 px-3 text-sm text-[#FFFFFF] lg:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#12151A]/95 px-4 py-4 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-[#FFFFFF]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-[#FFFFFF]"
            >
              Login
            </Link>
            <Link
              href="/onboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

const PLATFORM_LINKS = [
  { href: "#experience", label: "Experience" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
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

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.35fr_1fr_1fr]">
        <div>
          <MaiTabLogo
            variant="FullLogoWithText"
            onDark
            className="h-8 w-auto min-w-[9.5rem]"
          />
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
