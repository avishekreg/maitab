/**
 * Face match for mAISaarthi trip start.
 * Prefer Groq vision when available; fall back to fingerprint similarity demo.
 */

import { hasGroqKey, getGroqClient } from "@/lib/cloak/groq-client";
import {
  fingerprintDataUrl,
  type DriverEnrollment,
} from "@/lib/saarthi/enrollment";

export type FaceVerifyResult = {
  match: boolean;
  score: number; // 0..1
  method: "groq_vision" | "fingerprint_demo";
  reason: string;
  liveness_hint: string;
};

const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
] as const;

function fingerprintScore(a: string, b: string): number {
  if (a === b) return 0.97;
  // Compare numeric parts loosely for demo when same session re-capture differs
  const ha = a.split("_")[1] ?? "";
  const hb = b.split("_")[1] ?? "";
  if (!ha || !hb) return 0.2;
  let same = 0;
  const n = Math.min(ha.length, hb.length);
  for (let i = 0; i < n; i++) if (ha[i] === hb[i]) same++;
  return Math.min(0.92, 0.35 + (same / Math.max(n, 1)) * 0.55);
}

async function groqVisionCompare(
  enrolledSelfie: string,
  liveSelfie: string
): Promise<FaceVerifyResult | null> {
  const client = getGroqClient();
  if (!client || !hasGroqKey()) return null;

  const prompt = `You are mAISaarthi identity security. Compare ENROLLED driver selfie vs LIVE trip-start selfie.
Return STRICT JSON only:
{"same_person":true|false,"confidence":0.0-1.0,"spoof_risk":"low"|"medium"|"high","notes":"short"}
Reject if live image looks like a photo-of-a-photo, screen, mask, or different person.`;

  for (const model of VISION_MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "text", text: "ENROLLED:" },
              {
                type: "image_url",
                image_url: { url: enrolledSelfie },
              },
              { type: "text", text: "LIVE:" },
              {
                type: "image_url",
                image_url: { url: liveSelfie },
              },
            ],
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() || "{}";
      const parsed = JSON.parse(raw) as {
        same_person?: boolean;
        confidence?: number;
        spoof_risk?: string;
        notes?: string;
      };
      const score = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0)));
      const match =
        Boolean(parsed.same_person) &&
        score >= 0.72 &&
        (parsed.spoof_risk ?? "low") !== "high";
      return {
        match,
        score,
        method: "groq_vision",
        reason: parsed.notes || (match ? "Face match accepted" : "Face mismatch or spoof risk"),
        liveness_hint:
          parsed.spoof_risk === "high"
            ? "Possible screen/photo spoof detected"
            : "Vision model assessed spoof risk as " + (parsed.spoof_risk ?? "unknown"),
      };
    } catch {
      /* try next model */
    }
  }
  return null;
}

export async function verifyDriverFace(opts: {
  enrollment: DriverEnrollment;
  live_selfie_data_url: string;
  live_telemetry?: { lat?: number | null; lng?: number | null; captured_at?: string };
}): Promise<FaceVerifyResult> {
  const enrolled = opts.enrollment.photos.find((p) => p.kind === "SELFIE");
  if (!enrolled) {
    return {
      match: false,
      score: 0,
      method: "fingerprint_demo",
      reason: "No enrolled selfie on file",
      liveness_hint: "Re-enroll with a live selfie",
    };
  }

  const vision = await groqVisionCompare(
    enrolled.data_url,
    opts.live_selfie_data_url
  );
  if (vision) return vision;

  const liveFp = fingerprintDataUrl(opts.live_selfie_data_url);
  const score = fingerprintScore(opts.enrollment.selfie_fingerprint, liveFp);
  // Demo mode: require a fresh capture with telemetry timestamp
  const hasTime = Boolean(opts.live_telemetry?.captured_at);
  const match = score >= 0.55 && hasTime;

  return {
    match,
    score,
    method: "fingerprint_demo",
    reason: match
      ? "Demo fingerprint match (enable Groq vision for production-grade face compare)"
      : "Demo fingerprint mismatch — capture a fresh live selfie with GPS/time telemetry",
    liveness_hint: hasTime
      ? "Capture timestamp present"
      : "Missing capture timestamp — possible replay",
  };
}
