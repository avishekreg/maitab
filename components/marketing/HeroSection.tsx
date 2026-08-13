"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OptimusGlobe } from "@/components/marketing/OptimusGlobe";

/** Full phrases — natural 3–4 line wrap inside a wide, unclipped shell */
const PHRASES = [
  "a prepaid, self-settling revenue machine.",
  "an automated, high-margin profit engine.",
  "a zero-friction VIP loyalty magnet.",
] as const;

/**
 * Left: crisp copy · Right: revolving globe · Base: club ambient @35%
 */
export function HeroSection() {
  const [ready, setReady] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const phrase = PHRASES[phraseIndex] ?? PHRASES[0];

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-x-clip bg-[#0a0a0c]">
      <div className="absolute inset-0 -z-30 overflow-hidden">
        <Image
          src="/marketing/hero-nightlife.jpg"
          alt="Premium nightlife bar floor with purple and pink stage lights"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-35"
        />
        <div className="absolute inset-0 bg-[#0a0a0c]/40" />
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/2 overflow-hidden opacity-80 lg:w-7/12">
        <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle_at_60%_50%,rgba(139,92,246,0.42)_0%,rgba(6,182,212,0.16)_40%,transparent_68%)] blur-2xl" />
        <OptimusGlobe tone="light" className="relative h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-transparent to-black/30" />

      <div className="relative z-10 mx-auto w-full max-w-6xl overflow-visible px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl overflow-visible lg:max-w-5xl"
        >
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFFFFF] backdrop-blur-md">
            Nightlife OS · prepaid · self-settling
          </p>

          {/* Fixed-height shell — natural wrap, zero layout shift */}
          <div className="flex min-h-[220px] items-center overflow-visible sm:min-h-[240px]">
            <h1 className="w-full max-w-4xl overflow-visible font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-[#FFFFFF] drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] lg:max-w-5xl lg:text-5xl">
              <span className="block text-[#FFFFFF]">
                Turn every night into
              </span>
              <span className="relative mt-2 block min-h-[4.8em] overflow-visible">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phrase}
                    className="absolute inset-x-0 top-0 block overflow-visible bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] bg-clip-text pr-2 text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {phrase}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
          </div>

          <p className="mt-4 max-w-2xl font-sans text-lg font-medium leading-relaxed tracking-normal text-slate-200">
            Cryptographic table tabs, gate hospitality, bartender KDS, AV
            legends, 105 surprise games, and geo-fenced AutoPay — zero new
            hardware on the floor.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#system"
              className="inline-flex h-12 items-center rounded-xl bg-[#FFFFFF] px-5 font-sans text-sm font-semibold tracking-normal text-neutral-950 transition hover:bg-white/90"
            >
              See how the system works
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-white/40 bg-white/10 px-5 font-sans text-sm font-semibold tracking-normal text-[#FFFFFF] backdrop-blur-md transition hover:border-white/60 hover:bg-white/15"
            >
              Open live demo roles
            </Link>
          </div>

          <a
            href="#problem"
            className="mt-10 inline-flex items-center gap-2 font-sans text-base tracking-normal text-slate-200/80 transition hover:text-[#FFFFFF]"
          >
            Scroll for the full platform story
            <span aria-hidden className="animate-bounce">
              ↓
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
