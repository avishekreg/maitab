/**
 * mAI Cloak — AI Ghost Wingman.
 * Instant fallback when a whisper recipient is idle; silent backoff on human typing/reply.
 */

import { runTier1, runTier2Heuristic } from "@/lib/cloak/guardrail";

export const WINGMAN_IDLE_MS = 3500;
/** Typing indicator must resolve within ~1.5s (fetch runs in parallel). */
export const WINGMAN_TYPING_MIN_MS = 400;
export const WINGMAN_TYPING_MAX_MS = 1500;
/** Suppress AI only for active human 1-on-1 threads — not lounge. */
export const WINGMAN_SUPPRESS_MS = 120_000;
export const WINGMAN_MAX_WORDS = 18;

export const WINGMAN_SYSTEM_PROMPT = `You are an anonymous nightlife ghost in mAI Cloak shadow chat.
Persona: mysterious, charming nightlife conversationalist — witty luxury wingman/wingwoman.
Love electronic music, craft cocktails, playful banter.
HARD RULES:
- Never mention real names, phone numbers, social handles, tables, VIP codes, venues, dress/colors, or meetup spots.
- Never ask for contact info or suggest meeting outside.
- Keep the reply under ${WINGMAN_MAX_WORDS} words. High intrigue. One short line only.
- Output plain text only — no quotes, no labels, no meta commentary, max one subtle emoji if any.`;

/** Offline / no-key intrigue lines (still guardrail-safe). */
export const WINGMAN_FALLBACK_LINES = [
  "The bass just winked at us. Curious what you're chasing tonight?",
  "Mystery suits you. Prefer neon chaos or velvet calm?",
  "I collect rare pours and rarer silence. Which are you?",
  "Somewhere a synth is plotting. Shall we conspire?",
  "Not every ghost wants a name. Some want a spark.",
  "Craft ice, dark booth energy — what's your current frequency?",
  "I trade secrets for good taste. Offer a vibe?",
  "The night's unfinished. Leave me a riddle.",
] as const;

export function threadKey(fromId: string, toId: string | null): string {
  return `${fromId}::${toId ?? "lounge"}`;
}

export function inverseThreadKey(fromId: string, toId: string | null): string {
  // Human B replying to A suppresses wingman for A→B
  if (!toId) return `lounge::${fromId}`;
  return `${toId}::${fromId}`;
}

export function randomTypingDelayMs(): number {
  return (
    WINGMAN_TYPING_MIN_MS +
    Math.floor(
      Math.random() * (WINGMAN_TYPING_MAX_MS - WINGMAN_TYPING_MIN_MS + 1)
    )
  );
}

export function pickFallbackLine(seed?: string): string {
  const idx =
    seed && seed.length
      ? Math.abs(hash(seed)) % WINGMAN_FALLBACK_LINES.length
      : Math.floor(Math.random() * WINGMAN_FALLBACK_LINES.length);
  return WINGMAN_FALLBACK_LINES[idx]!;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Trim + re-check cloak filters before publishing an AI line. */
export function sanitizeWingmanReply(raw: string): string | null {
  let text = raw.replace(/^["'\s]+|["'\s]+$/g, "").trim();
  // Drop accidental multi-paragraph / reasoning dumps — keep last short line
  if (text.includes("\n")) {
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    text = lines[lines.length - 1] ?? text;
  }
  if (!text) return null;
  // Reject meta / compliance leaks from reasoning models
  if (
    /we need to comply|hard rules|as an ai|i am an ai|cannot mention|system prompt/i.test(
      text
    )
  ) {
    return null;
  }
  const words = text.split(/\s+/);
  if (words.length > WINGMAN_MAX_WORDS) {
    text = words.slice(0, WINGMAN_MAX_WORDS).join(" ");
  }
  if (runTier1(text) || runTier2Heuristic(text)) {
    return pickFallbackLine(text);
  }
  return text;
}

export type WingmanRequest = {
  incoming: string;
  recipientAlias: string;
  recent?: string[];
};

export type WingmanController = {
  cancel: () => void;
  aborted: () => boolean;
};

/**
 * Idle 4s → typing indicator + parallel Groq fetch → reply.
 * Typing resolves within WINGMAN_TYPING_MAX_MS (~1.5s) even if the model is faster.
 */
export function scheduleWingman(opts: {
  idleMs?: number;
  onTypingStart: () => void;
  onTypingEnd: () => void;
  generate: (signal: AbortSignal) => Promise<string | null>;
  onReply: (text: string) => void;
}): WingmanController {
  const idleMs = opts.idleMs ?? WINGMAN_IDLE_MS;
  const ac = new AbortController();
  let idleTimer: number | undefined;
  let settleTimer: number | undefined;

  idleTimer = window.setTimeout(() => {
    if (ac.signal.aborted) return;
    opts.onTypingStart();

    const typingMs = randomTypingDelayMs();
    const started = Date.now();
    const generatePromise = opts.generate(ac.signal).catch(() => null);

    const settle = async () => {
      if (ac.signal.aborted) {
        opts.onTypingEnd();
        return;
      }
      const remaining = Math.max(0, typingMs - (Date.now() - started));
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          settleTimer = window.setTimeout(resolve, remaining);
        });
      }
      if (ac.signal.aborted) {
        opts.onTypingEnd();
        return;
      }
      try {
        const text = await generatePromise;
        if (ac.signal.aborted || !text) {
          opts.onTypingEnd();
          return;
        }
        opts.onTypingEnd();
        opts.onReply(text);
      } catch {
        opts.onTypingEnd();
      }
    };

    void settle();
  }, idleMs);

  return {
    cancel() {
      ac.abort();
      if (idleTimer) window.clearTimeout(idleTimer);
      if (settleTimer) window.clearTimeout(settleTimer);
      opts.onTypingEnd();
    },
    aborted: () => ac.signal.aborted,
  };
}
