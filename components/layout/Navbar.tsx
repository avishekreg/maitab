"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu as MenuIcon, X, Rocket } from "lucide-react";
import { BrandLockup } from "@/components/branding/brand-lockup";

/** Canonical landing hashes — must match section `id`s on `/`. */
const NAV = [
  { href: "/#problem", id: "problem", label: "Problem" },
  { href: "/#system", id: "system", label: "System" },
  { href: "/#engines", id: "engines", label: "Engines" },
  { href: "/#how-it-works", id: "how-it-works", label: "How it works" },
  { href: "/#features-section", id: "features-section", label: "Features" },
  { href: "/#safety", id: "safety", label: "Safety" },
  { href: "/#pricing-section", id: "pricing-section", label: "Pricing" },
  { href: "/#compare", id: "compare", label: "Compare" },
  { href: "/#faq", id: "faq", label: "FAQ" },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${id}`);
  }
}

/** Minimal navbar — logo + Menu only. Conversion CTAs live in hero / menu sheet. */
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden border-b border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl">
      <div className="relative z-50 mx-auto box-border flex w-full max-w-7xl items-center justify-between overflow-hidden px-4 py-3">
        <BrandLockup
          href="/"
          className="min-w-0 flex-shrink-0 gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5"
        />

        <button
          type="button"
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-800 sm:text-sm"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          ) : (
            <MenuIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          )}
          <span>{open ? "Close" : "Menu"}</span>
        </button>
      </div>

      {open ? (
        <div className="max-w-full overflow-x-hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1"
            aria-label="Landing sections"
          >
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mb-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Open Live Demo Roles
            </Link>
            <Link
              href="/saarthi/driver-signup"
              onClick={() => setOpen(false)}
              className="mb-2 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-3.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Drive with mAISaarthi
            </Link>
            {NAV.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  window.setTimeout(() => scrollToSection(item.id), 50);
                }}
                className="rounded-lg px-3 py-3 text-sm text-white hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
