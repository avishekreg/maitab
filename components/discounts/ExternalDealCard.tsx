"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EXTERNAL_PROVIDERS,
  exclusivityNote,
  providerLabel,
  sessionHasApprovedExternalDeal,
} from "@/lib/discounts/bridge";
import { publishBus } from "@/lib/realtime/bus";
import { useSessionStore } from "@/lib/store/session-store";
import type { ActiveSession, ExternalProvider } from "@/lib/types";
import { cn, triggerHaptic } from "@/lib/utils";

export function ExternalDealApprovedModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: ActiveSession;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-champagne/20 bg-[#12151A] p-6 text-white shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent-gold">
              Deal activated
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold leading-tight">
              Zomato / Swiggy {session.discount_percentage}% Deal Activated!
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-nightlife-muted">
              Note: External deals cannot be combined with mAITab Native 1:1
              Flash Promos or Hourly 25% Lucky Draws.
            </p>
            <p className="mt-2 text-xs text-nightlife-muted">
              Ordering, Surprise Games, KDS haptics, and Geo-AutoPay stay fully
              active.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent-violet text-sm font-semibold"
              onClick={onClose}
            >
              Got it — keep ordering
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ExternalDealCard({
  onApproved,
}: {
  onApproved?: () => void;
}) {
  const session = useSessionStore((s) => s.session);
  const patchSession = useSessionStore((s) => s.patchSession);
  const [provider, setProvider] = useState<Exclude<ExternalProvider, "NONE">>(
    "ZOMATO_DISTRICT"
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const approved = sessionHasApprovedExternalDeal(session);
  const pending = session.discount_status === "PENDING_VERIFICATION";

  useEffect(() => {
    if (approved) onApproved?.();
  }, [approved, onApproved]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/discounts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          provider,
          voucherCode: code,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        reason?: string;
        session?: ActiveSession;
        bridge?: Record<string, unknown>;
      };
      if (!data.ok || !data.session) {
        setError(data.reason ?? "Could not link voucher");
        return;
      }
      patchSession(data.session);
      publishBus("discount_bridge", "PENDING_VERIFICATION", {
        ...data.bridge,
        table_hint: "B4",
      });
      void triggerHaptic(30);
      setCode("");
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-champagne/20 bg-white/[0.04] p-4 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-gold">
          Partner reservation
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-white">
          Have a Zomato / Swiggy / District Reservation?
        </h2>

        {approved ? (
          <div className="mt-3 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-3 text-sm text-accent-emerald">
            <p className="font-semibold">
              {providerLabel(session.external_provider)}{" "}
              {session.discount_percentage}% deal locked
            </p>
            <p className="mt-1 text-xs text-accent-emerald/80">
              {exclusivityNote(session.external_provider)} Native flash promos
              and lucky draws are off for this tab.
            </p>
            <button
              type="button"
              className="mt-2 text-xs underline underline-offset-2"
              onClick={() => setShowModal(true)}
            >
              View activation note
            </button>
          </div>
        ) : pending ? (
          <div className="mt-3 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-3 py-3 text-sm text-accent-gold">
            <p className="font-semibold">
              Pending staff verification ·{" "}
              {providerLabel(session.external_provider)}{" "}
              {session.discount_percentage}%
            </p>
            <p className="mt-1 text-xs text-accent-gold/80">
              Code {session.external_voucher_code}. Bar will tap Approve &amp;
              Lock Deal on KDS. Native promos stay available until approved.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-nightlife-muted">
              Enter your deal code. Staff verifies on KDS — once approved,
              native 1:1 Flash Promos and Hourly Lucky Draws lock out for this
              tab (anti double-dip). Ordering, games, and AutoPay stay on.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXTERNAL_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    provider === p.id
                      ? "border-accent-violet bg-accent-violet/15 text-white"
                      : "border-champagne/20 text-nightlife-muted hover:border-champagne/40"
                  )}
                >
                  <span className="font-medium text-white">{p.label}</span>
                  <span className="mt-0.5 block text-xs">
                    Default {p.defaultPercent}%
                  </span>
                </button>
              ))}
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Voucher code"
              className="h-11 w-full rounded-xl border border-champagne/20 bg-black/30 px-3 text-sm text-white placeholder:text-nightlife-muted focus:border-accent-violet focus:outline-none"
            />
            {error ? (
              <p className="text-xs text-accent-ruby">{error}</p>
            ) : null}
            <button
              type="button"
              disabled={busy || !code.trim()}
              onClick={() => void submit()}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent-violet text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Linking…" : "Request deal verification"}
            </button>
          </div>
        )}
      </div>

      <ExternalDealApprovedModal
        open={showModal}
        onClose={() => setShowModal(false)}
        session={session}
      />
    </>
  );
}
