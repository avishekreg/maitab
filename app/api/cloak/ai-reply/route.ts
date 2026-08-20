import { NextResponse, type NextRequest } from "next/server";
import {
  WINGMAN_SYSTEM_PROMPT,
  pickFallbackLine,
  sanitizeWingmanReply,
} from "@/lib/cloak/ai-ghost";
import { runTier1 } from "@/lib/cloak/guardrail";
import { groqWingman, hasGroqKey } from "@/lib/cloak/groq-client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    incoming?: string;
    recipientAlias?: string;
    recent?: string[];
  } | null;

  const incoming = (body?.incoming ?? "").trim();
  const alias = (body?.recipientAlias ?? "Ghost").slice(0, 48);
  const recent = Array.isArray(body?.recent) ? body!.recent!.slice(0, 6) : [];

  if (!incoming || runTier1(incoming)) {
    return NextResponse.json({
      ok: true,
      reply: pickFallbackLine(incoming || alias),
      source: "fallback",
    });
  }

  const userContent = [
    `You are ghost alias "${alias}" (never reveal you are AI).`,
    `Incoming whisper: ${incoming.slice(0, 400)}`,
    recent.length
      ? `Recent (anonymous): ${recent.slice(-4).join(" | ")}`
      : "",
    "Reply in under 18 words. Banter only — mysterious, charming, anonymous.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!hasGroqKey()) {
    return NextResponse.json({
      ok: true,
      reply: pickFallbackLine(incoming + alias),
      source: "fallback",
    });
  }

  const result = await groqWingman({
    system: WINGMAN_SYSTEM_PROMPT,
    user: userContent,
  });

  const cleaned = result ? sanitizeWingmanReply(result.content) : null;
  const reply = cleaned ?? pickFallbackLine(incoming + alias);

  return NextResponse.json({
    ok: true,
    reply,
    source: cleaned ? "llm" : "fallback",
    ...(cleaned && result
      ? { provider: result.provider, model: result.model }
      : {}),
  });
}
