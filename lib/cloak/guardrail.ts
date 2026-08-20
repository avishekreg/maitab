/**
 * mAI Cloak — multi-layer anonymity firewall.
 * Tier 1: regex / obfuscation · Tier 2: semantic AI (or heuristic) · Tier 3: mute.
 */

export type GuardStatus = "APPROVED" | "BLOCKED";

export type GuardDecision = {
  status: GuardStatus;
  reason: string;
  confidence: number;
  tier: 1 | 2 | 3;
  redactedPreview?: string;
};

export const CLOAK_WARNING =
  "⚠️ Cloak Protocol: Identity, contact, and location clues are strictly forbidden to keep the mystery safe.";

const MUTE_AFTER = 3;
const MUTE_MS = 5 * 60 * 1000;
const breachStore = new Map<string, { count: number; mutedUntil: number }>();

/** Hindi + English spelled digits / common obfuscation tokens */
const DIGIT_WORDS =
  "(zero|one|two|three|four|five|six|seven|eight|nine|oh|o|" +
  "ek|do|teen|char|chaar|paanch|panch|chhe|chhah|saat|aath|nau|das)";

const TIER1_PATTERNS: { re: RegExp; reason: string }[] = [
  // Phone / digit runs (spaced, dotted, hyphenated, continuous)
  {
    re: /(?:\+?\d[\d\s.\-]{7,}\d)|(?:\b\d{10}\b)/,
    reason: "Phone or digit sequence detected",
  },
  {
    re: new RegExp(
      `(?:${DIGIT_WORDS})(?:[\\s.\\-_/]*)(?:${DIGIT_WORDS})(?:[\\s.\\-_/]*(?:${DIGIT_WORDS})){3,}`,
      "i"
    ),
    reason: "Spelled-out phone digits detected",
  },
  // Binary / hex-ish dumps that could encode contact data
  {
    re: /\b(?:0x[0-9a-f]{6,}|[01]{16,})\b/i,
    reason: "Encoded digit payload detected",
  },
  // Social / contact handles
  {
    re: /(?:^|\s)@[a-z0-9._]{2,}/i,
    reason: "Social handle (@) detected",
  },
  {
    re: /\b(?:ig|insta|instagram|snap|snapchat|telegram|tg|whatsapp|wa\.me|fb|facebook|twitter|x\.com|linkedin)\b[:/\s]?/i,
    reason: "Social / messenger contact detected",
  },
  {
    re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/,
    reason: "Email address detected",
  },
  {
    re: /\b[\w.-]+@(?:okhdfcbank|okicici|oksbi|paytm|ybl|upi|gpay|phonepe)\b/i,
    reason: "UPI / payment handle detected",
  },
  {
    re: /\b(?:https?:\/\/|www\.)\S+|\b\S+\.(?:com|in|co|net|org|me|io)\b/i,
    reason: "URL / domain detected",
  },
  // Physical venue / table coordinates
  {
    re: /\b(?:vip[-\s]?\d+|table\s*\d+|tbl\s*\d+|booth\s*\d+)\b/i,
    reason: "Table / VIP identifier detected",
  },
  {
    re: /\b(?:bar\s*counter|dj\s*booth|smoking\s*zone|washroom|restroom|toilet|gate\s*(?:ke\s*)?(?:paas|side)|outside|parking|lift|elevator|corner\s*seat|near\s*the\s*(?:bar|dj|stage))\b/i,
    reason: "Venue location clue detected",
  },
];

const TIER2_HEURISTICS: { re: RegExp; reason: string }[] = [
  {
    re: /\b(?:wearing|wear|red\s+dress|black\s+shirt|white\s+top|blue\s+jeans|specs|glasses|cap|hat|hoodie|saree|lehenga|kurta)\b/i,
    reason: "Visual / dress marker detected",
  },
  {
    re: /\b(?:mera\s+naam|my\s+name\s+is|i\s+am\s+[a-z]{2,}|i'?m\s+[A-Z][a-z]+|i\s+work\s+at|i\s+am\s+from|main\s+[a-z]+\s+se\s+hoon)\b/i,
    reason: "Real identity claim detected",
  },
  {
    re: /\b(?:meet\s+me|come\s+to\s+my\s+table|gate\s+ke\s+paas|bahar\s+aa|pickup|pick\s+me|rendezvous|find\s+me\s+at)\b/i,
    reason: "Rendezvous / meetup prompt detected",
  },
  {
    re: /\b(?:phone|mobile|number|call\s+me|text\s+me|dm\s+me|whatsapp\s+me|send\s+(?:me\s+)?(?:your|ur)\s+(?:num|number|ig))\b/i,
    reason: "Contact solicitation detected",
  },
];

function normalizeObfuscation(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[０-９]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0xff10 + 0x30)
    );
}

export function runTier1(raw: string): GuardDecision | null {
  const text = normalizeObfuscation(raw);
  for (const { re, reason } of TIER1_PATTERNS) {
    if (re.test(text)) {
      return {
        status: "BLOCKED",
        reason,
        confidence: 0.97,
        tier: 1,
        redactedPreview: "[redacted by Cloak Tier-1]",
      };
    }
  }
  return null;
}

/** Fast local semantic heuristics (used when no LLM key / as pre-filter). */
export function runTier2Heuristic(raw: string): GuardDecision | null {
  const text = normalizeObfuscation(raw);
  for (const { re, reason } of TIER2_HEURISTICS) {
    if (re.test(text)) {
      return {
        status: "BLOCKED",
        reason,
        confidence: 0.88,
        tier: 2,
        redactedPreview: "[redacted by Cloak Tier-2]",
      };
    }
  }
  return null;
}

export function getMuteState(personaId: string): {
  muted: boolean;
  remainingMs: number;
  breaches: number;
} {
  const row = breachStore.get(personaId);
  if (!row) return { muted: false, remainingMs: 0, breaches: 0 };
  const remainingMs = Math.max(0, row.mutedUntil - Date.now());
  return {
    muted: remainingMs > 0,
    remainingMs,
    breaches: row.count,
  };
}

export function recordBreach(personaId: string): {
  muted: boolean;
  breaches: number;
} {
  const prev = breachStore.get(personaId) ?? { count: 0, mutedUntil: 0 };
  const count = prev.count + 1;
  const mutedUntil =
    count >= MUTE_AFTER ? Date.now() + MUTE_MS : prev.mutedUntil;
  breachStore.set(personaId, { count, mutedUntil });
  return { muted: mutedUntil > Date.now(), breaches: count };
}

export function resetBreaches(personaId: string) {
  breachStore.delete(personaId);
}

/**
 * Synchronous pipeline (Tier 1 + Tier 2 heuristic + mute).
 * Call async LLM via /api/cloak/guard for full Tier-2 when online.
 */
export function guardMessageSync(
  raw: string,
  personaId: string
): GuardDecision {
  const mute = getMuteState(personaId);
  if (mute.muted) {
    return {
      status: "BLOCKED",
      reason: `Muted for ${Math.ceil(mute.remainingMs / 1000)}s after repeated Cloak breaches`,
      confidence: 1,
      tier: 3,
    };
  }

  const t1 = runTier1(raw);
  if (t1) {
    recordBreach(personaId);
    return t1;
  }

  const t2 = runTier2Heuristic(raw);
  if (t2) {
    recordBreach(personaId);
    return t2;
  }

  return {
    status: "APPROVED",
    reason: "Passed local Cloak filters",
    confidence: 0.72,
    tier: 2,
  };
}

export const CLOAK_SYSTEM_PROMPT = `You are mAI Cloak Guardrail. Evaluate anonymous nightlife chat for ZERO leakage.
BLOCK if the message contains ANY of:
- Phone numbers, emails, UPI, social handles, URLs
- Real names, workplace, hometown identity claims
- Dress/color/appearance markers used to identify someone
- Venue coordinates (table, VIP, bar, DJ, washroom, gate, outside meetup)
- Requests to exchange contact or meet at a physical spot
APPROVE only playful, mystery-preserving banter with no identity/location/contact clues.
Respond JSON only: {"status":"APPROVED"|"BLOCKED","reason":string}`;

export type Tier2SemanticResult = GuardDecision & {
  provider?: "groq";
  model?: string;
};

/**
 * Tier-2 semantic guard via Groq (temp 0.1, strict JSON).
 * Falls back to local heuristics when Groq is unavailable.
 */
export async function runTier2Semantic(
  raw: string
): Promise<Tier2SemanticResult | null> {
  const text = normalizeObfuscation(raw).slice(0, 800);
  if (!text) return null;

  try {
    const { groqGuardJson } = await import("@/lib/cloak/groq-client");
    const result = await groqGuardJson({
      system: CLOAK_SYSTEM_PROMPT,
      user: text,
    });
    if (!result) return null;

    const parsed = JSON.parse(result.content) as {
      status?: string;
      reason?: string;
    };
    if (parsed.status !== "APPROVED" && parsed.status !== "BLOCKED") {
      return null;
    }
    return {
      status: parsed.status,
      reason: parsed.reason || "Groq Tier-2 semantic guard",
      confidence: parsed.status === "BLOCKED" ? 0.94 : 0.9,
      tier: 2,
      provider: "groq",
      model: result.model,
      ...(parsed.status === "BLOCKED"
        ? { redactedPreview: "[redacted by Cloak Tier-2]" }
        : {}),
    };
  } catch {
    return null;
  }
}
