/**
 * mAI Cloak — cyber persona & ghost session aliases.
 * Never embeds phone, real name, or table numbers in client payloads.
 */

export type CloakPersona = {
  id: string;
  alias: string;
  /** Neon glyph only — no photo / real avatar */
  glyph: string;
  accent: string;
  createdAt: number;
};

const ADJECTIVES = [
  "Neon",
  "Velvet",
  "Midnight",
  "Cyber",
  "Obsidian",
  "Chrome",
  "Phantom",
  "Lunar",
  "Violet",
  "Shadow",
  "Electric",
  "Noir",
] as const;

const NOUNS = [
  "Lynx",
  "Ghost",
  "Rogue",
  "Phantom",
  "Viper",
  "Oracle",
  "Spectre",
  "Raven",
  "Mirage",
  "Pulse",
  "Echo",
  "Blade",
] as const;

const GLYPHS = ["◈", "◉", "✦", "✧", "⬡", "⬢", "✧", "⟡", "✺", "✸"] as const;

const ACCENTS = [
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#818cf8",
  "#fb7185",
  "#2dd4bf",
] as const;

const STORAGE_KEY = "maitab-cloak-persona";

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatAlias(adj: string, noun: string, num: number) {
  return `${adj} ${noun} #${pad2(num)}`;
}

export function mintCloakPersona(): CloakPersona {
  const adj = rand(ADJECTIVES);
  const noun = rand(NOUNS);
  const num = 1 + Math.floor(Math.random() * 99);
  return {
    id: `cloak-${crypto.randomUUID().slice(0, 8)}`,
    alias: formatAlias(adj, noun, num),
    glyph: rand(GLYPHS),
    accent: rand(ACCENTS),
    createdAt: Date.now(),
  };
}

/** Load or mint a session-scoped ghost persona (ephemeral; cleared on purge). */
export function loadOrMintPersona(): CloakPersona {
  if (typeof window === "undefined") return mintCloakPersona();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CloakPersona;
      if (parsed?.id && parsed?.alias) return parsed;
    }
  } catch {
    /* ignore */
  }
  const next = mintCloakPersona();
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function purgePersona() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Public roster card — never includes phone, name, or table. */
export function publicGhostCard(p: CloakPersona) {
  return {
    id: p.id,
    alias: p.alias,
    glyph: p.glyph,
    accent: p.accent,
  };
}
