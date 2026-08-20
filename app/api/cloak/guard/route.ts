import { NextResponse, type NextRequest } from "next/server";
import {
  runTier1,
  runTier2Heuristic,
  runTier2Semantic,
  type GuardDecision,
} from "@/lib/cloak/guardrail";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    text?: string;
    personaId?: string;
  } | null;
  const text = (body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({
      status: "BLOCKED",
      reason: "Empty whisper",
      confidence: 1,
      tier: 1,
    } satisfies GuardDecision);
  }

  const t1 = runTier1(text);
  if (t1) return NextResponse.json(t1);

  // Tier-2: Groq semantic (temp 0.1, strict JSON) → heuristic fallback
  const semantic = await runTier2Semantic(text);
  if (semantic) {
    const { provider, model, ...decision } = semantic;
    return NextResponse.json({
      ...decision,
      ...(provider ? { provider, model } : {}),
    });
  }

  const heur = runTier2Heuristic(text);
  if (heur) return NextResponse.json(heur);

  return NextResponse.json({
    status: "APPROVED",
    reason: "Passed Cloak Tier-1 + Tier-2",
    confidence: 0.78,
    tier: 2,
  } satisfies GuardDecision);
}
