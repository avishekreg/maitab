"use client";

/**
 * Local fallback bus when Supabase Realtime is unavailable.
 * Uses BroadcastChannel so Gate/KDS/AV/Tab sync across tabs on the same origin.
 */

export type RealtimeTopic =
  | "gate_entry_events"
  | "orders"
  | "lucky_draw_awards"
  | "game_session_votes"
  | "game_session_rounds";

export interface BusEnvelope<T = unknown> {
  topic: RealtimeTopic;
  event: string;
  payload: T;
  at: number;
}

type Handler = (envelope: BusEnvelope) => void;

const CHANNEL = "maitab-realtime-bus";

export function publishBus<T>(
  topic: RealtimeTopic,
  event: string,
  payload: T
): void {
  if (typeof window === "undefined") return;
  const envelope: BusEnvelope<T> = {
    topic,
    event,
    payload,
    at: Date.now(),
  };
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage(envelope);
    bc.close();
  } catch {
    window.localStorage.setItem(
      `maitab_bus_${topic}`,
      JSON.stringify(envelope)
    );
  }
  window.dispatchEvent(
    new CustomEvent("maitab-bus", { detail: envelope })
  );
}

export function subscribeBus(
  topic: RealtimeTopic,
  handler: Handler
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onCustom = (e: Event) => {
    const envelope = (e as CustomEvent<BusEnvelope>).detail;
    if (envelope?.topic === topic) handler(envelope);
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key !== `maitab_bus_${topic}` || !e.newValue) return;
    try {
      handler(JSON.parse(e.newValue) as BusEnvelope);
    } catch {
      // ignore
    }
  };

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (msg) => {
      const envelope = msg.data as BusEnvelope;
      if (envelope?.topic === topic) handler(envelope);
    };
  } catch {
    bc = null;
  }

  window.addEventListener("maitab-bus", onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("maitab-bus", onCustom);
    window.removeEventListener("storage", onStorage);
    bc?.close();
  };
}
