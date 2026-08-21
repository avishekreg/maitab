"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ComplianceCapsule } from "@/components/landing/ComplianceCapsule";
import { OptimusGlobe } from "@/components/marketing/OptimusGlobe";

const PHRASES = [
  "an automated, high-margin profit engine.",
  "a prepaid, self-settling revenue machine.",
  "a zero-friction VIP loyalty magnet.",
] as const;

const CTA_CLASS =
  "inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl px-6 py-3 text-center text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]";

const PHRASE_CLASS =
  "col-start-1 row-start-1 block w-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_auto] bg-clip-text text-3xl font-extrabold leading-[1.15] tracking-tight text-transparent animate-gradient sm:text-5xl lg:text-7xl";

/**
 * Image-led hero — bright club plate, equal CTAs, floating compliance boundary.
 *
 * Phrase cycle: all lines stay mounted in a 1×1 CSS grid so the slot height
 * is always the tallest phrase. Only opacity/transform animate → no layout jerk.
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

  return (
    <section className="relative isolate w-full max-w-full overflow-x-hidden overflow-y-visible bg-[#0a0a0c]">
      <motion.div
        className="absolute inset-0 -z-30 overflow-hidden"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src="/marketing/hero-nightlife.jpg"
          alt="Premium nightlife bar floor with purple and pink stage lights"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      </motion.div>

      <div className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-[min(58%,20rem)] overflow-hidden opacity-40 sm:w-1/2 sm:opacity-50 lg:w-7/12">
        <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle_at_60%_50%,rgba(139,92,246,0.28)_0%,rgba(6,182,212,0.1)_40%,transparent_68%)] blur-2xl" />
        <OptimusGlobe tone="light" className="relative h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start justify-center px-4 pb-36 pt-8 text-left lg:min-h-[calc(100svh-4.5rem)] lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-4xl flex-col items-start"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5 inline-flex animate-badge-glow items-center rounded-full border border-white/30 bg-black/35 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:text-[11px]"
          >
            Nightlife OS · Prepaid · Self-settling
          </motion.p>

          <h1 className="w-full font-display drop-shadow-[0_2px_20px_rgba(0,0,0,0.75)]">
            <span className="block text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Turn every night into
            </span>

            {/* Stable phrase slot — grid stacks all lines; height = tallest */}
            <span
              className="relative my-2 grid w-full"
              aria-live="polite"
              aria-atomic="true"
            >
              {PHRASES.map((line, i) => {
                const active = i === phraseIndex;
                return (
                  <motion.span
                    key={line}
                    className={PHRASE_CLASS}
                    style={{
                      filter: active
                        ? "drop-shadow(0 0 18px rgba(168,85,247,0.45)) drop-shadow(0 0 24px rgba(6,182,212,0.25))"
                        : undefined,
                    }}
                    initial={false}
                    animate={{
                      opacity: active ? 1 : 0,
                      y: active ? 0 : 10,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    aria-hidden={!active}
                  >
                    {line}
                  </motion.span>
                );
              })}
            </span>
          </h1>

          <p className="mr-auto my-6 max-w-xl text-sm leading-relaxed text-zinc-200 sm:text-base">
            Cryptographic table tabs, gate hospitality, bartender KDS, AV
            legends, 105 surprise games, and geo-fenced AutoPay — zero new
            hardware on the floor.
          </p>

          <div className="relative z-20 mr-auto my-6 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/onboard"
              className={`${CTA_CLASS} bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.4)]`}
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`${CTA_CLASS} border border-white/25 bg-black/45 text-white backdrop-blur-md hover:bg-black/60`}
            >
              See how the system works
            </a>
          </div>
        </motion.div>

        {/* Full-width bottom of hero plate — centered, not tied to left copy column */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-2">
          <div className="pointer-events-auto w-full max-w-2xl">
            <ComplianceCapsule variant="boundary" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
