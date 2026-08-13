"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#problem", label: "The problem" },
  { href: "#system", label: "The system" },
  { href: "#journey", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#growth", label: "Growth" },
  { href: "#onboard", label: "Onboard" },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition",
        scrolled
          ? "border-b border-champagne/20 bg-nightlife-bg/90 backdrop-blur-2xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <MaiTabLogo variant="FullLogoWithText" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-sm text-nightlife-muted transition hover:bg-white/[0.04] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm text-nightlife-muted transition hover:text-white"
          >
            Demo login
          </Link>
          <a
            href="#onboard"
            className="inline-flex h-10 items-center rounded-xl bg-accent-violet px-4 text-sm font-semibold text-white shadow-glow-violet transition hover:brightness-110"
          >
            Book a walkthrough
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-3 text-sm text-white lg:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-nightlife-bg/95 px-4 py-4 backdrop-blur-xl lg:hidden">
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
              className="rounded-lg px-3 py-3 text-sm text-nightlife-muted"
            >
              Demo login
            </Link>
            <a
              href="#onboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-accent-violet text-sm font-semibold text-white"
            >
              Book a walkthrough
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-champagne/20 bg-[#0C0E12]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <MaiTabLogo variant="FullLogoWithText" className="h-8 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-nightlife-muted">
            Zero-hardware nightlife operating system for prepaid tabs, gate
            hospitality, bartender KDS, AV takeovers, social gaming, and
            geo-settled AutoPay. Part of the mAI ecosystem.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-nightlife-muted">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            <li>
              <a href="#system" className="hover:text-white">
                Platform overview
              </a>
            </li>
            <li>
              <a href="#journey" className="hover:text-white">
                Guest & staff journeys
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-white">
                Feature depth
              </a>
            </li>
            <li>
              <a href="#growth" className="hover:text-white">
                Revenue & retention
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-nightlife-muted">
            Demo
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            <li>
              <Link href="/login" className="hover:text-white">
                All 6 role logins
              </Link>
            </li>
            <li>
              <Link href="/home" className="hover:text-white">
                Guest experience
              </Link>
            </li>
            <li>
              <Link href="/admin/club" className="hover:text-white">
                Club admin console
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-nightlife-muted">
            Onboarding
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            <li>
              <a href="#onboard" className="hover:text-white">
                Venue walkthrough
              </a>
            </li>
            <li>
              <a href="mailto:hello@maitab.app" className="hover:text-white">
                hello@maitab.app
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-nightlife-muted sm:px-6">
          <p>© {new Date().getFullYear()} mAITab · mAI ecosystem</p>
          <p>Built for clubs, lounges, hotels & multi-venue groups</p>
        </div>
      </div>
    </footer>
  );
}
