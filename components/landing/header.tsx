"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLockup } from "@/components/branding/brand-lockup";

const NAV = [
  { href: "#problem", label: "Problem" },
  { href: "#system", label: "System" },
  { href: "#experience", label: "Experience" },
  { href: "#features", label: "Features" },
  { href: "#safety", label: "Safety" },
  { href: "#pricing", label: "Pricing" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <BrandLockup />

        <nav className="hidden items-center gap-0 xl:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-2 font-sans text-[13px] font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/onboard"
            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] px-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/25 px-3 text-sm text-white xl:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-white"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white"
            >
              Login
            </Link>
            <Link
              href="/onboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export { MarketingHeader as Header };
export default MarketingHeader;
