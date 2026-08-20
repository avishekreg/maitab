/**
 * Compatibility layer — Cloak LLM chat prefers the Groq SDK singleton.
 * New code should import from `@/lib/cloak/groq-client`.
 */

import {
  groqChat,
  hasGroqKey,
  GROQ_GUARD_TEMP,
  GROQ_WINGMAN_TEMP,
} from "@/lib/cloak/groq-client";

export {
  GROQ_WINGMAN_TEMP,
  GROQ_GUARD_TEMP,
  hasGroqKey as hasCloakLlmKey,
};

export const CLOAK_GROQ_MODEL_DEFAULT = "llama-3.1-8b-instant";
export const CLOAK_OPENAI_MODEL = "gpt-4o-mini";
export const CLOAK_GROQ_MODEL = CLOAK_GROQ_MODEL_DEFAULT;

export function cloakGroqModel(): string {
  return process.env.GROQ_CLOAK_MODEL?.trim() || CLOAK_GROQ_MODEL_DEFAULT;
}

export type CloakLlmChatOpts = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export type CloakLlmResult = {
  content: string;
  provider: "groq" | "openai";
  model: string;
};

export type CloakLlmFailure = {
  hasGroq: boolean;
  hasOpenai: boolean;
  lastStatus?: number;
  lastDetail?: string;
};

export async function cloakLlmChat(
  opts: CloakLlmChatOpts
): Promise<CloakLlmResult | null> {
  const { result } = await cloakLlmChatDetailed(opts);
  return result;
}

export async function cloakLlmChatDetailed(
  opts: CloakLlmChatOpts
): Promise<{ result: CloakLlmResult | null; failure: CloakLlmFailure }> {
  const failure: CloakLlmFailure = {
    hasGroq: hasGroqKey(),
    hasOpenai: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };

  const result = await groqChat({
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature:
      opts.temperature ??
      (opts.json ? GROQ_GUARD_TEMP : GROQ_WINGMAN_TEMP),
    maxTokens: opts.maxTokens,
    json: opts.json,
    mode: opts.json ? "guard" : "wingman",
  });

  if (result) {
    return {
      result: {
        content: result.content,
        provider: "groq",
        model: result.model,
      },
      failure,
    };
  }

  failure.lastDetail = "groq_unavailable";
  return { result: null, failure };
}
