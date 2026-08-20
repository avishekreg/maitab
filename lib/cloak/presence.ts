/**
 * mAI Cloak — live ghost presence registry.
 * Ephemeral only: BroadcastChannel + heartbeat. Never stores table IDs or PII.
 */

export type PresenceStatus = "ONLINE" | "IN_CONVERSATION" | "AWAY";

export type GhostPresence = {
  /** Ephemeral session UUID */
  id: string;
  alias: string;
  /** Seed for neon cyberpunk glyph / ring color */
  avatarSeed: string;
  glyph: string;
  accent: string;
  status: PresenceStatus;
  vibeTag: string;
  lastBeat: number;
};

export const PRESENCE_CHANNEL = "maitab-cloak-presence";
export const HEARTBEAT_MS = 15_000;
export const PRESENCE_TIMEOUT_MS = 60_000;

export const VIBE_TAGS = [
  "Sipping Long Island",
  "Vibing to Bass",
  "Open to Dares",
  "Neon Pulse Mode",
  "Craft Ice Ritual",
  "Shadow Booth Energy",
  "Looking for Sparks",
  "Bassline Daydream",
] as const;

export type PresenceEnvelope =
  | { type: "presence_join"; ghost: GhostPresence }
  | { type: "presence_beat"; ghost: GhostPresence }
  | { type: "presence_leave"; id: string }
  | { type: "presence_sync"; ghosts: GhostPresence[] };

function randVibe(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return VIBE_TAGS[Math.abs(h) % VIBE_TAGS.length]!;
}

export function mintPresenceCard(input: {
  id: string;
  alias: string;
  glyph: string;
  accent: string;
  status?: PresenceStatus;
  vibeTag?: string;
}): GhostPresence {
  return {
    id: input.id,
    alias: input.alias,
    avatarSeed: input.id,
    glyph: input.glyph,
    accent: input.accent,
    status: input.status ?? "ONLINE",
    vibeTag: input.vibeTag ?? randVibe(input.id + input.alias),
    lastBeat: Date.now(),
  };
}

/** In-memory presence map with 60s prune. */
export class PresenceRegistry {
  private map = new Map<string, GhostPresence>();

  upsert(ghost: GhostPresence) {
    this.map.set(ghost.id, { ...ghost, lastBeat: Date.now() });
  }

  beat(ghost: GhostPresence) {
    this.upsert({ ...ghost, lastBeat: Date.now() });
  }

  leave(id: string) {
    this.map.delete(id);
  }

  setStatus(id: string, status: PresenceStatus) {
    const row = this.map.get(id);
    if (!row) return;
    this.map.set(id, { ...row, status, lastBeat: Date.now() });
  }

  prune(now = Date.now()): string[] {
    const dropped: string[] = [];
    for (const [id, g] of Array.from(this.map.entries())) {
      if (now - g.lastBeat > PRESENCE_TIMEOUT_MS) {
        this.map.delete(id);
        dropped.push(id);
      }
    }
    return dropped;
  }

  list(): GhostPresence[] {
    this.prune();
    return Array.from(this.map.values()).sort((a, b) =>
      a.alias.localeCompare(b.alias)
    );
  }

  onlineCount(): number {
    return this.list().filter((g) => g.status !== "AWAY").length;
  }

  get(id: string): GhostPresence | undefined {
    this.prune();
    return this.map.get(id);
  }

  replaceAll(ghosts: GhostPresence[]) {
    this.map = new Map(ghosts.map((g) => [g.id, g]));
    this.prune();
  }
}

export function createPresenceChannel(handlers: {
  onEnvelope: (env: PresenceEnvelope) => void;
}): {
  publish: (env: PresenceEnvelope) => void;
  close: () => void;
} {
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(PRESENCE_CHANNEL);
    bc.onmessage = (ev: MessageEvent<PresenceEnvelope>) => {
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

export const MATCH_COOLDOWN_MS = 30_000;

/**
 * Pick a random online ghost for Mystery Match.
 * Prefers idle ONLINE guests; falls back to IN_CONVERSATION; never self/AWAY.
 */
export function pickMysteryMatch(
  ghosts: GhostPresence[],
  selfId: string,
  opts?: { excludeIds?: string[]; allowAmbient?: boolean; ambientId?: string }
): GhostPresence | null {
  const exclude = new Set(opts?.excludeIds ?? []);
  exclude.add(selfId);

  const pool = ghosts.filter((g) => {
    if (exclude.has(g.id)) return false;
    if (g.status === "AWAY") return false;
    if (!opts?.allowAmbient && opts?.ambientId && g.id === opts.ambientId) {
      return false;
    }
    return true;
  });

  const idle = pool.filter((g) => g.status === "ONLINE");
  const candidates = idle.length > 0 ? idle : pool;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
