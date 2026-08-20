/**
 * mAI Cloak — Groq SDK singleton.
 * Ultra-fast wingman banter + Tier-2 semantic guardrail.
 *
 * Preferred models (in order): llama-3.1-8b-instant → llama3-8b-8192 →
 * openai/gpt-oss-20b (Groq retired Llama 3.1 8B Instant for free/dev on 2026-08-16).
 */

import Groq from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

export const GROQ_WINGMAN_TEMP = 0.7;
export const GROQ_GUARD_TEMP = 0.1;

/** User-requested + legacy + current Groq free-tier fallback. */
export const GROQ_MODEL_CANDIDATES = [
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "openai/gpt-oss-20b",
] as const;

export type GroqChatRole = "system" | "user" | "assistant";

export type GroqChatMessage = {
  role: GroqChatRole;
  content: string;
};

export type GroqChatOpts = {
  messages: GroqChatMessage[];
  temperature: number;
  maxTokens?: number;
  /** Strict JSON object mode when true. */
  json?: boolean;
  /** Prefer lower latency for wingman (caps tokens). */
  mode?: "wingman" | "guard";
  signal?: AbortSignal;
};

export type GroqChatResult = {
  content: string;
  model: string;
  provider: "groq";
};

let client: Groq | null = null;
let resolvedModel: string | null = null;

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Lazily construct one Groq client per process. */
export function getGroqClient(): Groq | null {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  if (!client) {
    client = new Groq({ apiKey: key });
  }
  return client;
}

function preferredModels(): string[] {
  const override = process.env.GROQ_CLOAK_MODEL?.trim();
  if (override) {
    return [
      override,
      ...GROQ_MODEL_CANDIDATES.filter((m) => m !== override),
    ];
  }
  return [...GROQ_MODEL_CANDIDATES];
}

function extractContent(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length ? t : null;
}

/**
 * Chat completion via Groq SDK. Tries preferred Llama models, then gpt-oss.
 * Caches the first working model for subsequent calls in this process.
 */
export async function groqChat(
  opts: GroqChatOpts
): Promise<GroqChatResult | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  const models = resolvedModel
    ? [resolvedModel, ...preferredModels().filter((m) => m !== resolvedModel)]
    : preferredModels();

  const maxTokens =
    opts.maxTokens ??
    (opts.mode === "guard" ? 80 : opts.mode === "wingman" ? 48 : 120);

  let lastErr: string | null = null;

  for (const model of models) {
    try {
      const body: ChatCompletionCreateParamsNonStreaming = {
        model,
        temperature: opts.temperature,
        max_tokens: maxTokens,
        stream: false,
        messages: opts.messages,
      };
      if (opts.json) {
        body.response_format = { type: "json_object" };
      }
      // gpt-oss: hide chain-of-thought so wingman stays witty, not meta
      if (model.includes("gpt-oss")) {
        body.include_reasoning = false;
        body.reasoning_effort = "low";
      }

      const completion = await groq.chat.completions.create(
        body,
        opts.signal ? { signal: opts.signal } : undefined
      );

      const content = extractContent(
        completion.choices?.[0]?.message?.content
      );
      if (!content) {
        lastErr = `empty_content:${model}`;
        continue;
      }

      resolvedModel = model;
      return { content, model, provider: "groq" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastErr = msg.slice(0, 160);
      // Try next candidate on model_not_found / access errors
      if (/model_not_found|does not exist|decommission/i.test(msg)) {
        continue;
      }
      // Auth / rate limit: stop early
      if (/invalid.?api.?key|401|429|authentication/i.test(msg)) {
        break;
      }
    }
  }

  if (process.env.NODE_ENV === "development" && lastErr) {
    console.warn("[cloak/groq]", lastErr);
  }
  return null;
}

/** Wingman: temp 0.7, short witty banter. */
export async function groqWingman(opts: {
  system: string;
  user: string;
  signal?: AbortSignal;
}): Promise<GroqChatResult | null> {
  return groqChat({
    mode: "wingman",
    temperature: GROQ_WINGMAN_TEMP,
    maxTokens: 48,
    signal: opts.signal,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
}

/** Guard: temp 0.1, strict JSON moderation. */
export async function groqGuardJson(opts: {
  system: string;
  user: string;
  signal?: AbortSignal;
}): Promise<GroqChatResult | null> {
  return groqChat({
    mode: "guard",
    temperature: GROQ_GUARD_TEMP,
    maxTokens: 80,
    json: true,
    signal: opts.signal,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
}

/** Test helper / hot-reload: clear cached client + model. */
export function resetGroqClientForTests() {
  client = null;
  resolvedModel = null;
}
