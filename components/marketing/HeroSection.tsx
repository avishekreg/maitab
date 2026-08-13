"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OptimusGlobe } from "@/components/marketing/OptimusGlobe";

/** Full phrases — natural wrap; mobile shell sized to avoid overlap */
const PHRASES = [
  "a prepaid, self-settling revenue machine.",
  "an automated, high-margin profit engine.",
  "a zero-friction VIP loyalty magnet.",
] as const;

/**
 * Mobile: globe is a soft upper backdrop under a heavy scrim — copy never fights it.
 * Desktop: globe lives in the right half; copy anchored left.
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
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#0a0a0c]">
      <div className="absolute inset-0 -z-30">
        <Image
          src="/marketing/hero-nightlife.jpg"
          alt="Premium nightlife bar floor with purple and pink stage lights"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-35"
        />
        <div className="absolute inset-0 bg-[#0a0a0c]/45" />
      </div>

      {/* Globe plane — constrained on small screens so it cannot crush the type */}
      <div
        className="pointer-events-none absolute -z-20 overflow-hidden opacity-45 sm:opacity-55 lg:opacity-80"
        aria-hidden
      >
        <div
          className={[
            "absolute",
            /* mobile / tablet: upper band only */
            "inset-x-[-12%] top-[3.5rem] h-[min(46vh,340px)]",
            "sm:inset-x-[-8%] sm:top-16 sm:h-[min(50vh,420px)]",
            /* desktop: right half, full hero height */
            "lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:top-0 lg:h-full lg:w-[58%]",
          ].join(" ")}
        >
          <div className="absolute inset-[-10%] rounded-full bg-[radial-gradient(circle_at_55%_45%,rgba(139,92,246,0.38)_0%,rgba(6,182,212,0.14)_42%,transparent_70%)] blur-2xl" />
          <OptimusGlobe
            tone="light"
            className="relative h-full w-full scale-[0.92] sm:scale-100 lg:scale-105"
          />
        </div>
      </div>

      {/* Scrims — mobile leans bottom-heavy so CTAs stay readable */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/50 to-black/90 lg:hidden" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/88 via-black/55 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-t from-black/55 via-transparent to-black/25 lg:block" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-[4.75rem] sm:px-6 sm:pb-14 sm:pt-24 lg:justify-center lg:pb-20 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
        >
          <p className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF] backdrop-blur-md sm:mb-5 sm:text-[11px] sm:tracking-[0.18em]">
            Nightlife OS · prepaid · self-settling
          </p>

          <h1 className="font-display text-[1.85rem] font-extrabold leading-[1.18] tracking-tight text-[#FFFFFF] drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)] sm:text-4xl sm:leading-[1.15] lg:text-5xl">
            <span className="block text-[#FFFFFF]">Turn every night into</span>
            <span className="relative mt-1.5 block min-h-[3.55em] sm:mt-2 sm:min-h-[3.9em] lg:min-h-[4.35em]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phrase}
                  className="absolute inset-x-0 top-0 block bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] bg-clip-text pr-1 text-transparent"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {phrase}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mt-3 max-w-xl font-sans text-[0.95rem] font-medium leading-relaxed tracking-normal text-slate-200 sm:mt-4 sm:text-lg">
            Cryptographic table tabs, gate hospitality, bartender KDS, AV
            legends, 105 surprise games, and geo-fenced AutoPay — zero new
            hardware on the floor.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <a
              href="#system"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#FFFFFF] px-5 font-sans text-sm font-semibold tracking-normal text-neutral-950 transition hover:bg-white/90 sm:w-auto"
            >
              See how the system works
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 font-sans text-sm font-semibold tracking-normal text-[#FFFFFF] backdrop-blur-md transition hover:border-white/60 hover:bg-white/15 sm:w-auto"
            >
              Open live demo roles
            </Link>
          </div>

          <a
            href="#problem"
            className="mt-8 inline-flex items-center gap-2 font-sans text-sm tracking-normal text-slate-200/80 transition hover:text-[#FFFFFF] sm:mt-10 sm:text-base"
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
