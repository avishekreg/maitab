"use client";

import { useCallback, useEffect, useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { useSessionStore } from "@/lib/store/session-store";

function webAuthnSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/**
 * 1-tap biometric enroll / unlock for permanent guest identity (Layer 1).
 */
export function PasskeyEnrollPrompt() {
  const user = useSessionStore((s) => s.user);
  const hydrateGuestShell = useSessionStore((s) => s.hydrateGuestShell);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSupported(webAuthnSupported());
  }, []);

  const enroll = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const optRes = await fetch("/api/auth/passkey/register/options");
      const optJson = (await optRes.json()) as {
        ok: boolean;
        guestId?: string;
        options?: PublicKeyCredentialCreationOptionsJSON;
        error?: string;
      };
      if (!optJson.ok || !optJson.options || !optJson.guestId) {
        setNote(optJson.error || "Could not start passkey enrollment");
        return;
      }
      const attestation = (await startRegistration({
        optionsJSON: optJson.options,
      })) as RegistrationResponseJSON;
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: optJson.guestId,
          response: attestation,
        }),
      });
      const verifyJson = (await verifyRes.json()) as {
        ok: boolean;
        error?: string;
        guest?: {
          id: string;
          full_name: string;
          vip_tier: "STANDARD" | "GOLD" | "BLACK_DIAMOND";
          loyalty_points: number;
          lifetime_spend: number;
          passkey_enrolled: boolean;
        };
      };
      if (!verifyJson.ok || !verifyJson.guest) {
        setNote(verifyJson.error || "Enrollment verification failed");
        return;
      }
      hydrateGuestShell({
        user: {
          ...user,
          id: verifyJson.guest.id,
          full_name: verifyJson.guest.full_name,
          vip_tier: verifyJson.guest.vip_tier,
          loyalty_points: verifyJson.guest.loyalty_points,
          lifetime_spend: verifyJson.guest.lifetime_spend,
          passkey_enrolled: true,
        },
        session: null,
      });
      setNote("Biometric VIP unlock enabled on this device.");
      setDismissed(true);
    } catch (e) {
      setNote(
        e instanceof Error
          ? e.message
          : "Passkey canceled or unavailable on this device"
      );
    } finally {
      setBusy(false);
    }
  }, [hydrateGuestShell, user]);

  const unlock = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const optRes = await fetch("/api/auth/passkey/authenticate/options");
      const optJson = (await optRes.json()) as {
        ok: boolean;
        options?: PublicKeyCredentialRequestOptionsJSON;
        error?: string;
      };
      if (!optJson.ok || !optJson.options) {
        setNote(optJson.error || "Could not start passkey unlock");
        return;
      }
      const assertion = (await startAuthentication({
        optionsJSON: optJson.options,
      })) as AuthenticationResponseJSON;
      const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      const verifyJson = (await verifyRes.json()) as {
        ok: boolean;
        error?: string;
        guest?: {
          id: string;
          full_name: string;
          vip_tier: "STANDARD" | "GOLD" | "BLACK_DIAMOND";
          loyalty_points: number;
          lifetime_spend: number;
        };
      };
      if (!verifyJson.ok || !verifyJson.guest) {
        setNote(verifyJson.error || "Unlock failed");
        return;
      }
      const current = await fetch("/api/sessions/current").then((r) => r.json());
      if (current?.ok && current.user) {
        hydrateGuestShell({
          user: current.user,
          session: current.session,
          orders: current.orders,
          venue: current.venue,
        });
      }
      setNote("Welcome back — loyalty wallet restored.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Unlock canceled");
    } finally {
      setBusy(false);
    }
  }, [hydrateGuestShell]);

  if (!supported || dismissed) return null;
  if (user.passkey_enrolled) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        <p className="font-semibold">1-Tap Biometric active</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void unlock()}
          className="mt-2 text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
        >
          Unlock with FaceID / TouchID / Device PIN
        </button>
        {note ? <p className="mt-1 text-xs text-emerald-200/80">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/35 bg-violet-500/10 px-4 py-4 text-sm text-violet-50">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/20">
          <Fingerprint className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">
            Enable 1-Tap Biometric (FaceID / Fingerprint / Device PIN) for VIP
            fast-checkout &amp; spend history.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void enroll()}
              className="rounded-xl bg-violet-500 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "Waiting for device…" : "Enable 1-Tap Biometric"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-xl border border-white/15 px-3.5 py-2 text-xs font-medium text-zinc-300"
            >
              Not now
            </button>
          </div>
          {note ? <p className="mt-2 text-xs text-violet-200/80">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}
