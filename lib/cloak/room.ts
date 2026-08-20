/**
 * Ephemeral cloak chat room — in-memory + BroadcastChannel.
 * Auto-purges on session close / tab hide. No durable identity logs.
 */

import type { CloakPersona } from "@/lib/cloak/persona";

export type CloakMessage = {
  id: string;
  fromId: string;
  fromAlias: string;
  fromGlyph: string;
  fromAccent: string;
  /** Null = lounge broadcast whisper */
  toId: string | null;
  body: string;
  kind: "text" | "system" | "mystery_nudge";
  /** Relative label only — never absolute clock */
  relative: "Just now";
  at: number;
};

export type CloakRoomSnapshot = {
  ghosts: ReturnType<typeof import("@/lib/cloak/persona").publicGhostCard>[];
  messages: CloakMessage[];
  updatedAt: number;
};

type Envelope =
  | { type: "join"; ghost: CloakRoomSnapshot["ghosts"][number] }
  | { type: "leave"; id: string }
  | { type: "msg"; message: CloakMessage }
  | { type: "sync"; snapshot: CloakRoomSnapshot }
  | { type: "purge" }
  /** Real human typing — cancels pending AI wingman for this thread */
  | {
      type: "cloak_typing";
      fromId: string;
      /** Conversation peer (null = lounge) */
      peerId: string | null;
      active: boolean;
    };

const CHANNEL = "maitab-cloak-lounge";
const MAX_MESSAGES = 80;

let ghosts = new Map<string, CloakRoomSnapshot["ghosts"][number]>();
let messages: CloakMessage[] = [];

function snapshot(): CloakRoomSnapshot {
  return {
    ghosts: Array.from(ghosts.values()),
    messages: [...messages],
    updatedAt: Date.now(),
  };
}

export function getCloakSnapshot(): CloakRoomSnapshot {
  return snapshot();
}

export function cloakJoin(persona: CloakPersona) {
  const card = {
    id: persona.id,
    alias: persona.alias,
    glyph: persona.glyph,
    accent: persona.accent,
  };
  ghosts.set(persona.id, card);
  return card;
}

export function cloakLeave(id: string) {
  ghosts.delete(id);
}

export function cloakAppend(message: CloakMessage) {
  messages = [...messages, message].slice(-MAX_MESSAGES);
}

export function cloakPurgeAll() {
  ghosts = new Map();
  messages = [];
}

export function createCloakChannel(handlers: {
  onEnvelope: (env: Envelope) => void;
}): {
  publish: (env: Envelope) => void;
  close: () => void;
} {
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev: MessageEvent<Envelope>) => {
      if (ev.data) handlers.onEnvelope(ev.data);
    };
  } catch {
    bc = null;
  }

  return {
    publish(env) {
      try {
        bc?.postMessage(env);
      } catch {
        /* ignore */
      }
    },
    close() {
      try {
        bc?.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export type { Envelope as CloakEnvelope };
