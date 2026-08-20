"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLockup } from "@/components/branding/brand-lockup";
import { DEMO_GATE_EVENTS } from "@/lib/demo/data";
import { fetchRecentGateEvents } from "@/lib/data/gate";
import { useGateRealtime } from "@/lib/hooks/use-gate-realtime";
import {
  useLuckyDrawRealtime,
  type LuckyDrawAward,
} from "@/lib/hooks/use-lucky-draw-realtime";
import { NEON_CLUB_ID } from "@/lib/supabase/env";
import type { GateEntryEvent, SpendTier } from "@/lib/types";
import { TIER_RANK } from "@/lib/types";

function welcomeLine(name: string) {
  const parts = name.split(" ");
  const first = parts[0] ?? name;
  const lastInitial = parts[1]?.[0] ? `${parts[1][0]}.` : "";
  return `Welcome ${first} ${lastInitial}`.trim();
}

export default function AvPanelPage() {
  const [events, setEvents] = useState<GateEntryEvent[]>(DEMO_GATE_EVENTS);
  const [hero, setHero] = useState<GateEntryEvent | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);
  const [luckyBanner, setLuckyBanner] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  function playChime() {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = audioCtxRef.current ?? new AudioCtx();
    audioCtxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  const presentEvent = useCallback((event: GateEntryEvent) => {
    if (seenRef.current.has(event.id)) return;
    seenRef.current.add(event.id);

    setEvents((prev) => {
      if (prev.some((item) => item.id === event.id)) return prev;
      return [event, ...prev].slice(0, 12);
    });

    const rank = TIER_RANK[event.spend_tier as SpendTier];
    if (rank <= 1) return;
    if (rank === 2) {
      setTicker(welcomeLine(event.guest_name));
      window.setTimeout(() => setTicker(null), 9000);
      return;
    }
    if (rank === 3) {
      playChime();
      setTicker(welcomeLine(event.guest_name));
      window.setTimeout(() => setTicker(null), 10000);
      return;
    }
    playChime();
    setHero(event);
    window.setTimeout(() => setHero(null), 3000);
  }, []);

  useGateRealtime(NEON_CLUB_ID, presentEvent);

  const onLucky = useCallback((award: LuckyDrawAward) => {
    playChime();
    setLuckyBanner(
      `LUCKY DRAW · Table session wins ${award.discount_percent}% off`
    );
    window.setTimeout(() => setLuckyBanner(null), 8000);
  }, []);

  useLuckyDrawRealtime(NEON_CLUB_ID, onLucky);

  useEffect(() => {
    void fetchRecentGateEvents(NEON_CLUB_ID).then((live) => {
      if (live?.length) {
        setEvents(live);
        live.forEach((event) => seenRef.current.add(event.id));
      }
    });
  }, []);

  const queue = useMemo(() => events.slice(0, 6), [events]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_480px_at_12%_-8%,rgba(124,58,237,0.22),transparent_55%),radial-gradient(780px_420px_at_92%_0%,rgba(6,182,212,0.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-zinc-950/70 px-8 py-6 backdrop-blur-2xl">
          <BrandLockup />
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
            LED / AV · Realtime
          </p>
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 animate-lux-enter">
          <p className="text-sm uppercase tracking-[0.28em] text-violet-300">
            VIP Entry Queue
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-extrabold leading-tight text-zinc-50 md:text-7xl">
            Hospitality hits the wall.
          </h1>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {queue.map((event) => (
              <div
                key={event.id}
                className="lux-glass-dark lux-sheen lux-interactive border-l-2 border-l-violet-400/70 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  {event.spend_tier}
                </p>
                <p className="type-title mt-1 text-2xl text-zinc-50">
                  {event.guest_name}
                </p>
              </div>
            ))}
          </div>
        </main>

        <div className="relative h-14 overflow-hidden border-t border-white/10 bg-zinc-950/90">
          {luckyBanner ? (
            <div className="absolute inset-y-0 flex items-center whitespace-nowrap animate-ticker text-xl font-semibold text-emerald-400">
              {luckyBanner} · {luckyBanner}
            </div>
          ) : ticker ? (
            <div className="absolute inset-y-0 flex items-center whitespace-nowrap animate-ticker text-xl font-semibold text-amber-300">
              {ticker} · mAITab Gold arrival · {ticker}
            </div>
          ) : (
            <div className="flex h-full items-center px-6 text-sm text-zinc-500">
              Listening on gate_entry_events…
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {hero ? (
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 grid place-items-center bg-zinc-950/95 backdrop-blur-xl"
          >
            <div className="animate-hero-burst text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-amber-300">
                Titan Alert
              </p>
              <h2 className="mt-4 bg-luxury-gradient bg-clip-text font-display text-5xl font-extrabold text-transparent md:text-7xl">
                mAITab LEGEND IN THE HOUSE
              </h2>
              <p className="mt-4 text-2xl text-zinc-200">{hero.guest_name}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
