"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/MarketingChrome";
import { SaarthiProvider } from "@/components/saarthi/SaarthiProvider";
import { HeroSection } from "@/components/landing/HeroSection";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { CapacitorLoginRedirect } from "@/components/native/CapacitorLoginRedirect";

const PAINS = [
  {
    title: "Open tabs that never close",
    copy: "Staff chase cards at 2am. Guests “forget” to settle. Managers write off leakage they can’t even measure.",
  },
  {
    title: "POS hardware that slows the night",
    copy: "Terminals, printers, and brittle integrations add cost and friction — while the dancefloor is already moving faster than your queue.",
  },
  {
    title: "VIP recognition that lives in WhatsApp",
    copy: "Gate, bar, and AV run on verbal handoffs. High-value guests arrive with no system memory of who they are or what they spend.",
  },
  {
    title: "Promos that cannibalize the block",
    copy: "You discount beer while the lounge 800m away runs the same flash deal — and neither of you can prove who won the night.",
  },
];

const GUEST_STEPS = [
  {
    n: "01",
    title: "Arrive with a Member Pass",
    copy: "Guests present a cryptographic QR pass at the gate. Staff see name, spend tier (Bronze → Titan), favorites, and AutoPay status in one scan — then a micro-hold verifies the mandate before entry.",
  },
  {
    n: "02",
    title: "Join a table with a signed QR",
    copy: "Each table token is cryptographically sealed, so guests can’t spoof URLs. If tables are merged, child scans silently route to the host session. Ordering unlocks without re-entering a PIN every round.",
  },
  {
    n: "03",
    title: "Order, play, tip the energy",
    copy: "Drinks hit the prepaid tab instantly. Ready tickets buzz the phone. Surprise games (105+ nightlife prompts) keep the table engaged — and every penalty is a one-tap upsell back onto the same tab.",
  },
  {
    n: "04",
    title: "Walk out. The night settles itself.",
    copy: "When GPS leaves your 50m fence and distance keeps rising, AutoPay closes the session, marks it settled, and dispatches a digital receipt. No closing line. No forgotten card.",
  },
];

const STAFF_STEPS = [
  {
    role: "Gate",
    copy: "Camera scanner, hospitality profile, micro-hold check — zero access to revenue dashboards.",
  },
  {
    role: "Bartender",
    copy: "KDS queue with token numbers and one-tap Mark Ready. No customer PII. No admin settings.",
  },
  {
    role: "Floor Manager",
    copy: "Zone allocation, multi-bar counter routing, and shift mapping before the doors open.",
  },
  {
    role: "AV",
    copy: "Standalone LED browser panel: silent alerts, tickers, chimes, and Titan hero takeovers from live gate events.",
  },
  {
    role: "Club Admin",
    copy: "Menu, merges, display toggles, lucky draw, and geo-aware flash promos from one venue console.",
  },
];

const ENTERPRISE_OPS = [
  {
    code: "01",
    title: "Floor Manager & Multi-Bar Counter Routing",
    body: "Smart 4-Digit Token Handshake (#4829) routes drinks directly from nearest bar counters to assigned waiters with zero verbal confusion or alcohol leakage.",
    accent: "#E2B857",
  },
  {
    code: "02",
    title: "Flash Promo & Geo-Push Engine",
    body: "1-Tap Instant Happy Hours for checked-in guests, plus monetized Geo-Targeted Flash Campaigns powered by Platform Promo Credits to drive instant footfall.",
    accent: "#A78BFA",
  },
  {
    code: "03",
    title: "Multi-Venue Owner Switcher",
    body: "Manage multiple clubs, lounges, and rooftops under a single unified executive console with real-time GMV and KDS telemetry.",
    accent: "#34D399",
  },
  {
    code: "04",
    title: "License Compliance Watchdog",
    body: "Liquor and FSSAI expiry monitoring with amber warnings 15 days out — then automatic floor freeze on guest ordering and check-in until renewal uploads restore LIVE status.",
    accent: "#F472B6",
  },
];

const FEATURES = [
  {
    title: "Prepaid Bar Tab (no re-auth loop)",
    body: "Guests authorize once via AutoPay mandate. Every order, penalty drink, and lucky-draw adjustment lands on the same running session. That removes the #1 conversion killer in nightlife: asking for a card again mid-song.",
    outcome:
      "Higher mid-night spend because ordering feels continuous — not like a checkout.",
  },
  {
    title: "Gate hospitality network",
    body: "Member Pass scanning is built for bouncers and hosts: camera-first UI, spend-tier recognition, favorite-drink context, and a background micro-hold that proves the mandate works before the guest hits the floor.",
    outcome:
      "VIP treatment that feels personal — and financially safe for the venue.",
  },
  {
    title: "Bartender KDS + haptic handoff",
    body: "Tickets appear as clear tokens (e.g. #204 · 2× Heineken). Mark Ready fires a high-priority vibration pattern and on-screen buzzer to the guest phone so the “two-shelf” pickup actually happens.",
    outcome: "Faster turn on the bar, fewer abandoned ready drinks.",
  },
  {
    title: "AV wall takeovers",
    body: "An independent browser panel listens to gate events. Silver gets a ticker. Gold gets chime + highlight. Titan gets a full-screen legend moment. Lucky-draw wins can celebrate on the same wall.",
    outcome:
      "Spectacle that makes high spenders feel seen — and makes others aspire.",
  },
  {
    title: "Table merge & pre-book discipline",
    body: "Staff can merge B4+B5+B6 into a parent-child cluster. Child QR scans route to the host. A configurable pre-booking buffer blocks reckless merges that would collide with reserved slots.",
    outcome: "Flexible floor plans without breaking reservation integrity.",
  },
  {
    title: "105+ Surprise Games engine",
    body: "Shot roulette, truth-or-shot, dare wheels, Never Have I Ever votes, spin-the-bottle, and Most Likely To — weighted, no-repeat for two hours, with a Pay Penalty / Order Round CTA on every outcome.",
    outcome:
      "Social dwell time that converts directly into incremental drink revenue.",
  },
  {
    title: "Geo anti-cannibalization lockouts",
    body: "Flash promos check live geography. If a competitor within ~1.5km already holds the same category lockout, mAITab blocks the duplicate deal instead of burning margin for nothing.",
    outcome: "Smarter promotions. Less race-to-the-bottom on your own street.",
  },
  {
    title: "Geo-fenced AutoPay settlement",
    body: "The guest phone watches distance from the venue. Exit the 50m buffer and keep moving for the sustain window — settlement fires through your payment provider hooks and marks the session complete.",
    outcome: "Dramatically fewer unpaid walkouts and end-of-night write-offs.",
  },
  {
    title: "Hourly Lucky Draw",
    body: "Eligible non-VIP sessions above your spend threshold can win an automatic percentage off the running bill — with celebration on the guest device and optional AV broadcast.",
    outcome:
      "A retention loop: guests stay longer and come back for another shot at the drop.",
  },
];

const GROWTH = [
  {
    title: "Increase spend per head",
    copy: "Frictionless re-ordering + game penalties + lucky-draw near-misses keep the tab open. Guests don’t “pause the night” to dig for a card.",
  },
  {
    title: "Increase table turn quality",
    copy: "Faster KDS handoffs and clearer session ownership mean staff serve more rounds per occupied table without feeling chaotic.",
  },
  {
    title: "Increase repeat visitation",
    copy: "Spend tiers (Bronze → Titan) create status memory. AV recognition and Member Pass history make regulars feel known — the strongest reason to return to your room instead of the club next door.",
  },
  {
    title: "Increase trust at the door",
    copy: "Micro-holds and AutoPay status at gate reduce the anxiety of letting high-energy nights run on open credit. Your team hosts more boldly.",
  },
  {
    title: "Protect promotional margin",
    copy: "Spatial lockouts stop you from funding the same BEER war as your competitor. Promo budget goes to nights you can actually win.",
  },
  {
    title: "Operate multi-venue from one brain",
    copy: "Super Admin sees platform GMV, fraud signals, and integration keys. Club Admins stay focused on their floor. Roles never leak access they shouldn’t have.",
  },
];

const COMPARE = [
  {
    old: "Shared paper tab / POS terminal",
    next: "Mandate-backed prepaid session per table host",
  },
  {
    old: "Verbal VIP list & Instagram DMs",
    next: "Tiered Member Pass + live gate → AV pipeline",
  },
  {
    old: "Staff chase settlement at exit",
    next: "50m geo fence + AutoPay auto-close",
  },
  {
    old: "Random WhatsApp games / no monetization",
    next: "105 games with one-tap drink upsells",
  },
  {
    old: "Blind flash deals vs neighbors",
    next: "Geo-aware category lockouts",
  },
  {
    old: "Hardware lock-in & slow change",
    next: "Zero-hardware web surfaces per role",
  },
];

const SAFETY_SHOWCASE = [
  {
    emoji: "🍸",
    badge: "PROPRIETARY SAFETY TECH",
    badgeClass:
      "border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.25)]",
    title: "Predictive Transit Assistance",
    kicker: "Smart Transit Concierge AI",
    body: "Our proprietary telemetry engine dynamically gauges session pacing and alcohol units billed, proactively nudging guests at checkout with a dedicated Chauffeur Concierge before they step out.",
    pills: [
      "✓ Non-Intrusive Care",
      "✓ Auto-Detected Venue Gate",
      "✓ Zero Drink & Drive Risk",
    ],
  },
  {
    emoji: "🚗",
    badge: "BUILT-IN MOBILITY LAYER",
    badgeClass:
      "border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.28)]",
    title: "Your Car, Our Verified Chauffeur",
    kicker: "mAISaarthi — On-Demand Valet Chauffeur Network",
    body: "Guests never leave luxury wheels behind. With 1-tap dispatch, police-verified chauffeurs certified for premium AT/DCT/EV transmissions arrive at the valet to drive guests home in their own car.",
    pills: [
      "🛡️ Police Verified",
      "📸 4-Angle Pre-Trip Scan",
      "🔢 Handshake OTP Protected",
    ],
  },
] as const;

const FAQ = [
  {
    q: "Do we need to rip out our POS?",
    a: "No. mAITab is designed as a POS-independent guest and floor layer. You can run prepaid sessions, gate, KDS, and AV without installing new terminals — then connect settlement providers through the integration hub.",
  },
  {
    q: "How do guests pay?",
    a: "Through an AutoPay mandate via our Automated Direct-Settlement Gateway. Gate can run a micro-hold to verify the mandate. Exit geofencing settles the remaining session balance.",
  },
  {
    q: "Is this only for guests, or for staff too?",
    a: "Both. Five public venue roles ship with dedicated surfaces: Customer, Gate, Bartender, AV, and Club Admin — each deliberately limited to what that job needs.",
  },
  {
    q: "How fast can a venue try it?",
    a: "Immediately via the public demo roles on this deployment. For production, Syncra Systems LLP maps your clubs, tables, and staff into the Proprietary Real-Time Nightlife Engine, wires settlement credentials, and walks the floor team through a live night.",
  },
];

function SectionEyebrow({
  children,
  onDark = false,
}: {
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <p className={onDark ? "type-eyebrow text-[#A38B5E]" : "type-eyebrow"}>
      {children}
    </p>
  );
}

function SectionTitle({
  children,
  onDark = false,
}: {
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <h2
      className={
        onDark
          ? "mt-3 max-w-3xl font-display text-[clamp(1.5rem,5vw,2.75rem)] font-bold tracking-tight text-white"
          : "mt-3 max-w-3xl font-display text-[clamp(1.5rem,5vw,2.75rem)] font-bold tracking-tight text-zinc-900"
      }
    >
      {children}
    </h2>
  );
}

export default function MarketingLandingPage() {
  return (
    <SaarthiProvider>
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#FAF9F5] text-zinc-900">
      <CapacitorLoginRedirect />
      <MarketingHeader />

      <HeroSection />

      {/* PROBLEM — top pad clears capsule dipping into cream via translate-y-1/2 */}
      <section
        id="problem"
        className="scroll-mt-24 border-t border-border bg-secondary/70 pt-20 sm:pt-24"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>The problem</SectionEyebrow>
          <SectionTitle>
            Nightlife still runs on trust, paper, and panic — and it costs you
            more than you think.
          </SectionTitle>
          <p className="type-body mt-5 max-w-2xl text-lg text-slate-800">
            Your best nights are also your messiest: open tabs, slow bars,
            forgotten settlements, VIP confusion, and promo wars with the venue
            down the street. Guests feel the friction. Staff absorb the chaos.
            Owners only see the write-offs later.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {PAINS.map((pain, i) => (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: 4 }}
                className="border-t border-border pt-6 transition-colors"
              >
                <h3 className="type-title text-xl text-foreground sm:text-2xl">
                  {pain.title}
                </h3>
                <p className="type-body mt-3 text-base text-slate-800 sm:text-lg">
                  {pain.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SYSTEM */}
      <section id="system" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>The system</SectionEyebrow>
          <SectionTitle>
            One operating layer above the floor — not another terminal on it.
          </SectionTitle>
          <p className="mt-5 max-w-3xl font-sans text-lg leading-relaxed tracking-normal text-slate-800">
            mAITab connects the guest phone, the door, the bar, the LED wall,
            and the manager console into a single session pipeline. A guest
            enters with a verified mandate, spends against a live prepaid tab,
            gets recognized when they matter, and settles automatically when
            they leave your geofence. Staff tools are role-locked so nobody is
            staring at data they don’t need.
          </p>

          <div className="mt-14 grid gap-10 border-y border-border py-10 lg:grid-cols-3">
            {[
              {
                k: "Guest web app",
                v: "Home, Tab, Member Pass, Surprise Games — mobile-first, haptic-aware, GPS-aware.",
              },
              {
                k: "Ops surfaces",
                v: "Gate scanner, bartender KDS, and a dedicated AV browser panel for the LED wall.",
              },
              {
                k: "Admin brain",
                v: "Club console for the venue. Super Admin for platform GMV, fraud, flags, and encrypted API keys.",
              },
            ].map((item) => (
              <div key={item.k}>
                <p className="font-sans text-lg font-semibold tracking-normal text-foreground">
                  {item.k}
                </p>
                <p className="mt-3 font-sans text-base leading-relaxed tracking-normal text-slate-800 sm:text-lg">
                  {item.v}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl font-sans text-base leading-relaxed tracking-normal text-slate-800 sm:text-lg">
            Under the hood: a Proprietary Real-Time Nightlife Engine, High-Throughput
            Cryptographic Ledger for sealed QR joins, Fault-Tolerant Floor
            Orchestration Architecture for role-locked ops, and an Automated
            Direct-Settlement Gateway for AutoPay. You sell the night — mAITab
            runs the machinery.
          </p>

          <div className="mt-16">
            <SectionEyebrow>Enterprise architecture</SectionEyebrow>
            <SectionTitle>
              Operations modules built for multi-bar floors and group owners.
            </SectionTitle>
            <p className="type-body mt-5 max-w-2xl text-lg text-slate-800">
              Floor routing, flash monetization, multi-property control, and
              license lockout — the layer that turns a single venue stack into
              an enterprise nightlife OS.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {ENTERPRISE_OPS.map((item, i) => (
                <motion.button
                  key={item.title}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                className="lux-sheen lux-interactive group relative overflow-hidden rounded-2xl border border-slate-900/15 bg-gradient-to-br from-white via-[#F8FAFC] to-[#EEF2FF]/90 p-6 text-left shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl transition-all duration-lux ease-lux focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A38B5E] sm:p-7"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(600px circle at var(--mx, 50%) var(--my, 0%), ${item.accent}22, transparent 45%)`,
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className="font-mono text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: item.accent }}
                      >
                        Module {item.code}
                      </p>
                      <span
                        className="h-2 w-2 rounded-full transition group-hover:scale-125"
                        style={{ background: item.accent }}
                      />
                    </div>
                    <h3 className="mt-4 font-sans text-xl font-bold text-zinc-900 sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-sans text-base leading-relaxed text-zinc-700 sm:text-lg">
                      {item.body}
                    </p>
                    <p
                      className="mt-5 text-sm font-semibold tracking-wide transition group-hover:translate-x-1"
                      style={{ color: item.accent }}
                    >
                      Explore in ops console →
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW ENGINES SHOWCASE — Cloak · Arcade · Saarthi */}
      <section
        id="engines"
        className="scroll-mt-24 border-t border-white/10 bg-zinc-950 text-zinc-300"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow onDark>Built for the floor</SectionEyebrow>
          <SectionTitle onDark>
            Three new engines already shipping inside the guest night.
          </SectionTitle>
          <p className="mt-5 max-w-3xl font-sans text-lg leading-relaxed text-zinc-300">
            Anonymous social, tactile party play, and zero-liability rides —
            each wired into the same tab session so venues monetize the night
            without new hardware.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                href: "/tab/cloak",
                cta: "Preview Cloak →",
                kicker: "mAI Cloak",
                kickerClass: "text-violet-300",
                title: "In-Venue Anonymous Shadow Lounge",
                body: (
                  <>
                    3-Tier AI Privacy Firewall, Zero Contact Leaks, Randomized
                    Cyber Personas{" "}
                    <span className="text-violet-200">(Neon Lynx #42)</span>, and
                    Mystery Drink Gifting — whisper without exposing the phone
                    number.
                  </>
                ),
                points: [
                  "Guardrailed lounge + 1:1 whisper channels",
                  "Mystery Match + AI wingman when the floor is quiet",
                  "Persona roster with live presence",
                ],
                cardClass:
                  "border-violet-500/35 bg-gradient-to-b from-violet-500/15 to-zinc-900/80 shadow-[0_0_40px_rgba(139,92,246,0.12)] hover:border-violet-400/60 hover:shadow-[0_0_48px_rgba(139,92,246,0.28)]",
                ctaClass:
                  "border-violet-400/50 bg-violet-500/20 text-violet-100 hover:bg-violet-500/30",
              },
              {
                href: "/game",
                cta: "Open Arcade →",
                kicker: "Party Arcade",
                kickerClass: "text-fuchsia-300",
                title: "Tactile Multiplayer & Arcade Party Engine",
                body: (
                  <>
                    Inertia-Physics Prize Wheel, Live Table Voting & Accusations
                    (Jackbox / PartyKit style), and Zero-Hardware Tab Penalties —
                    every round can upsell back onto the prepaid tab.
                  </>
                ),
                points: [
                  "105+ nightlife prompts & surprise games",
                  "Lucky wheel without bill % discount leaks",
                  "Table party sync for shared rounds",
                ],
                cardClass:
                  "border-fuchsia-500/35 bg-gradient-to-b from-fuchsia-500/15 to-zinc-900/80 shadow-[0_0_40px_rgba(217,70,239,0.12)] hover:border-fuchsia-400/60 hover:shadow-[0_0_48px_rgba(217,70,239,0.28)]",
                ctaClass:
                  "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100 hover:bg-fuchsia-500/30",
              },
              {
                href: "/saarthi",
                cta: "Book mAISaarthi →",
                secondaryHref: "/saarthi/driver-signup",
                secondaryCta: "Drive with us →",
                kicker: "mAISaarthi",
                kickerClass: "text-cyan-300",
                title: "Zero-Liability Return Ride Network",
                body: (
                  <>
                    Safe guest drop-off integration, direct chauffeur dispatch,
                    and instant club liability protection when the tab is still
                    open and the night is ending.
                  </>
                ),
                points: [
                  "Verified chauffeur booking from the guest app",
                  "Venue-branded “Don't Drink & Drive” CTA",
                  "Closes the night without walking guests to risk",
                ],
                cardClass:
                  "border-cyan-500/35 bg-gradient-to-b from-cyan-500/15 to-zinc-900/80 shadow-[0_0_40px_rgba(6,182,212,0.12)] hover:border-cyan-400/60 hover:shadow-[0_0_48px_rgba(6,182,212,0.28)]",
                ctaClass:
                  "border-cyan-400/50 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30",
              },
            ].map((card, i) => (
              <motion.article
                key={card.kicker}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.015 }}
                className={`flex flex-col rounded-2xl border p-6 transition-shadow duration-300 ${card.cardClass}`}
              >
                <p
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${card.kickerClass}`}
                >
                  {card.kicker}
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">
                  {card.title}
                </h3>
                <p className="mt-4 flex-1 font-sans text-sm leading-relaxed text-zinc-300 sm:text-base">
                  {card.body}
                </p>
                <ul className="mt-5 space-y-2 font-sans text-sm text-zinc-400">
                  {card.points.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col gap-2">
                  <Link
                    href={card.href}
                    className={`inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${card.ctaClass}`}
                  >
                    {card.cta}
                  </Link>
                  {"secondaryHref" in card && card.secondaryHref ? (
                    <Link
                      href={card.secondaryHref}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                    >
                      {card.secondaryCta}
                    </Link>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY — typography reference surface (dark) */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-t border-white/10 bg-zinc-950 text-zinc-300"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow onDark>How it works</SectionEyebrow>
          <SectionTitle onDark>
            From door to dancefloor to debit — the full guest journey.
          </SectionTitle>

          <div className="mt-12 space-y-0">
            {GUEST_STEPS.map((step, i) => (
              <div
                key={step.n}
                className="grid gap-4 border-t border-white/10 py-8 md:grid-cols-[88px_1fr]"
              >
                <p className="font-sans text-sm font-normal tracking-normal text-zinc-400">
                  {step.n}
                </p>
                <div>
                  <h3 className="font-sans text-xl font-bold tracking-normal text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-3xl font-sans text-base leading-relaxed text-zinc-300 sm:text-lg">
                    {step.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h3 className="font-sans text-2xl font-bold text-white">
              Meanwhile, every staff role stays on-mission
            </h3>
            <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-zinc-300 sm:text-lg">
              RBAC isn’t a checkbox — it’s how you keep the floor fast. Each
              surface is purpose-built and deliberately incomplete for anyone
              outside that job.
            </p>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {STAFF_STEPS.map((row) => (
                <div
                  key={row.role}
                  className="grid gap-2 py-5 sm:grid-cols-[160px_1fr] sm:gap-8"
                >
                  <p className="font-sans text-base font-bold text-[#A38B5E]">
                    {row.role}
                  </p>
                  <p className="font-sans text-base leading-relaxed text-zinc-300 sm:text-lg">
                    {row.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features-section"
        className="scroll-mt-24 border-t border-border"
      >        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>Feature depth</SectionEyebrow>
          <SectionTitle>
            Everything that makes a night run — engineered as one product.
          </SectionTitle>
          <p className="type-body mt-5 max-w-2xl text-lg text-slate-800">
            These aren’t bolted-on widgets. Each capability feeds the same
            session, the same spend ledger, and the same hospitality memory.
          </p>

          <div className="mt-14 space-y-12">
            {FEATURES.map((feature, i) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="grid gap-4 border-t border-border pt-10 lg:grid-cols-[1fr_1fr] lg:gap-12"
              >
                <div>
                  <p className="type-eyebrow text-[#A38B5E]/90">
                    Module {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="type-title mt-2 text-2xl text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <div>
                  <p className="type-body text-base text-slate-800 sm:text-lg">
                    {feature.body}
                  </p>
                  <p className="type-body mt-4 text-base text-[#A38B5E] sm:text-lg">
                    Business effect: {feature.outcome}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* RESPONSIBLE HOSPITALITY & SAFETY */}
      <section
        id="safety"
        className="scroll-mt-24 border-t border-white/10 bg-zinc-950 text-zinc-300"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow onDark>Responsible hospitality & safety</SectionEyebrow>
          <SectionTitle onDark>
            Social responsibility engineered into the night — not bolted on at
            last call.
          </SectionTitle>
          <p className="mt-5 max-w-3xl font-sans text-lg leading-relaxed text-zinc-300">
            Cognitive safety telemetry plus a verified chauffeur network keep
            guests, venues, and vehicles protected when the tab is still open.
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {SAFETY_SHOWCASE.map((card, i) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition-shadow hover:border-zinc-600 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <span
                  className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${card.badgeClass}`}
                >
                  {card.badge}
                </span>
                <p className="mt-5 text-xs font-mono font-semibold tracking-wider text-zinc-300">
                  {card.emoji} {card.kicker}
                </p>
                <h3 className="mt-2 font-display text-2xl font-black leading-snug tracking-tight text-white">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm font-normal leading-relaxed text-zinc-300 md:text-base">
                  {card.body}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {card.pills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-zinc-700 bg-zinc-950 px-3.5 py-1.5 font-mono text-xs text-zinc-200"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-cyan-500/35 bg-gradient-to-r from-cyan-500/15 via-zinc-900 to-zinc-950 p-6 sm:p-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Chauffeurs
            </p>
            <h3 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Drive with mAISaarthi
            </h3>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-zinc-300 sm:text-base">
              Enroll with DL, Aadhaar, police clearance, and live selfie (GPS
              &amp; timestamp). Super Admin verifies documents, then you go live
              for venue return rides.
            </p>
            <Link
              href="/saarthi/driver-signup"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/25 px-5 text-sm font-bold text-cyan-50 transition hover:bg-cyan-500/40"
            >
              Start driver signup →
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING — dedicated B2B tiers on landing */}
      <section
        id="pricing-section"
        className="scroll-mt-24 border-t border-[#DAD7D0] bg-[#FAF9F5] py-24 text-zinc-900"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <SectionTitle>
            Venue plans built for single rooms, multi-bar floors, and group
            owners.
          </SectionTitle>
          <p className="mt-5 max-w-3xl font-sans text-lg leading-relaxed text-zinc-700">
            Transparent monthly platforms plus GMV share — no POS hardware
            purchase, no per-terminal fees. Start with one venue or roll out
            across the portfolio.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "₹19,999/mo + 10% GMV",
                blurb: "Single venue — gate, tab, KDS, and AutoPay.",
                points: [
                  "1 venue",
                  "Floor QR & Member Pass",
                  "Basic flash promos",
                ],
              },
              {
                name: "Pro",
                price: "₹29,999/mo + 8% GMV",
                blurb: "Multi-venue portfolio with floor routing.",
                points: [
                  "Multi-venue switcher",
                  "Waiter / bar counter routing",
                  "Geo flash campaigns",
                ],
                featured: true,
              },
              {
                name: "Enterprise Group",
                price: "Annual SLA",
                blurb:
                  "Group owners with dedicated onboarding & SLA.",
                points: [
                  "Annual contract",
                  "Dedicated CSM",
                  "Custom integrations",
                ],
              },
            ].map((tier, i) => (
              <motion.article
                key={tier.name}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.015 }}
                className={
                  tier.featured
                    ? "flex flex-col rounded-2xl border-2 border-violet-500/60 bg-white p-6 shadow-[0_0_32px_rgba(139,92,246,0.15)] transition-shadow hover:shadow-[0_16px_48px_rgba(139,92,246,0.25)]"
                    : "flex flex-col rounded-2xl border border-[#DAD7D0] bg-white p-6 transition-shadow hover:shadow-xl"
                }
              >
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#A38B5E]">
                  {tier.name}
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold text-zinc-900">
                  {tier.price}
                </h3>
                <p className="mt-3 font-sans text-base leading-relaxed text-zinc-700">
                  {tier.blurb}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5 font-sans text-sm text-zinc-800">
                  {tier.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboard"
                  className={
                    tier.featured
                      ? "mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] text-sm font-semibold text-white"
                      : "mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800"
                  }
                >
                  Get started
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH OUTCOMES */}
      <section
        id="growth"
        className="scroll-mt-24 border-t border-[#DAD7D0] bg-[#FAF9F5] text-zinc-900"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>Why it grows the business</SectionEyebrow>
          <SectionTitle>
            Not just “digitized ops” — measurable traction on spend, return
            visits, and night integrity.
          </SectionTitle>
          <p className="type-body mt-5 max-w-3xl text-lg text-slate-800">
            Venue owners don’t buy software for novelty. They buy it when it
            moves money, reduces leakage, and makes regulars choose their room
            again. mAITab is designed around those three outcomes.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GROWTH.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="lux-glass-cream lux-interactive rounded-xl p-5"
              >
                <div className="mb-4 h-px w-10 bg-[#A38B5E]" />
                <h3 className="type-title text-lg text-[#080503]">
                  {item.title}
                </h3>
                <p className="type-body mt-3 text-base text-slate-800 sm:text-lg">
                  {item.copy}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl rounded-xl border border-[#DAD7D0] border-l-4 border-l-[#A38B5E] bg-white/70 p-6">
            <p className="type-title text-xl text-[#080503] sm:text-2xl">
              Repeat visitors aren’t luck. They’re recognition, status, and a
              night that never punished them with checkout friction.
            </p>
            <p className="type-body mt-4 text-base text-slate-800 sm:text-lg">
              Spend tiers, Member Pass history, AV celebration, and lucky-draw
              near-misses create a loop: show up → get recognized → spend
              easily → leave cleanly → come back for the next drop. That’s how
              a club becomes a habit instead of a one-off Instagram story.
            </p>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>Why mAITab vs the old way</SectionEyebrow>
          <SectionTitle>
            Replace fragile night rituals with a system guests can feel.
          </SectionTitle>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_1fr] bg-secondary px-4 py-3 type-eyebrow text-[#A38B5E]/80 sm:px-6">
              <span>Traditional night</span>
              <span className="text-[#A38B5E]">With mAITab</span>
            </div>
            {COMPARE.map((row) => (
              <div
                key={row.old}
                className="grid grid-cols-1 gap-2 border-t border-border px-4 py-5 sm:grid-cols-2 sm:gap-8 sm:px-6"
              >
                <p className="type-body text-base text-slate-800/70 line-through decoration-slate-400">
                  {row.old}
                </p>
                <p className="type-body text-base font-medium text-slate-800 sm:text-lg">
                  {row.next}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border bg-pastel-mint/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionTitle>Straight answers for operators evaluating us.</SectionTitle>
          <div className="mt-12 divide-y divide-black/10 border-y border-border">
            {FAQ.map((item) => (
              <div key={item.q} className="grid gap-3 py-7 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
                <h3 className="type-title text-lg text-foreground">
                  {item.q}
                </h3>
                <p className="type-body text-base text-slate-800 sm:text-lg">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="onboard"
        className="scroll-mt-20 border-t border-border bg-secondary"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <MaiTabLogo variant="FullLogoWithText" className="h-10 w-auto" />
          <h2 className="mt-8 max-w-2xl font-display text-3xl font-bold text-foreground sm:text-4xl">
            Put mAITab on your next busy night — then decide with real floor
            evidence.
          </h2>
          <p className="type-body mt-5 max-w-2xl text-lg text-slate-800">
            We’ll walk gate, bar, AV, admin, and guest flows with your team,
            map your rooms and tables, and connect AutoPay when you’re ready
            for production. Start with the live demo roles today; onboard the
            venue when the night proves itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:hello@maitab.app?subject=mAITab%20venue%20walkthrough"
              className="lux-interactive lux-focus-ring inline-flex h-12 items-center rounded-xl bg-accent-violet px-5 text-sm font-semibold text-white shadow-glow-violet transition-all duration-lux ease-lux hover:brightness-110"
            >
              Book a venue walkthrough
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition hover:border-border"
            >
              Try venue demo roles
            </Link>
            <Link
              href="/home"
              className="inline-flex h-12 items-center rounded-xl px-5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Preview guest app →
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
    </SaarthiProvider>
  );
}
