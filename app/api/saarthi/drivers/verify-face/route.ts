import { NextResponse } from "next/server";
import {
  getEnrollment,
  getEnrollmentByPhone,
  recordFaceVerify,
} from "@/lib/saarthi/enrollment";
import { verifyDriverFace } from "@/lib/saarthi/face-verify";

export const runtime = "nodejs";

/**
 * POST — live selfie vs enrolled mAISaarthi driver face.
 * Called at trip start / accept to block proxy drivers.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      enrollment_id?: string;
      phone?: string;
      live_selfie_data_url?: string;
      live_telemetry?: {
        lat?: number | null;
        lng?: number | null;
        captured_at?: string;
      };
    };

    if (!body.live_selfie_data_url) {
      return NextResponse.json(
        { ok: false, error: "live_selfie_data_url required" },
        { status: 400 }
      );
    }

    const enrollment =
      (body.enrollment_id && getEnrollment(body.enrollment_id)) ||
      (body.phone && getEnrollmentByPhone(body.phone)) ||
      null;

    if (!enrollment) {
      return NextResponse.json(
        { ok: false, error: "Driver enrollment not found — complete signup first" },
        { status: 404 }
      );
    }

    if (!body.live_telemetry?.captured_at) {
      return NextResponse.json(
        {
          ok: false,
          error: "Live capture timestamp required (anti-replay)",
        },
        { status: 400 }
      );
    }

    const result = await verifyDriverFace({
      enrollment,
      live_selfie_data_url: body.live_selfie_data_url,
      live_telemetry: body.live_telemetry,
    });

    recordFaceVerify(enrollment.id, result.score);

    return NextResponse.json({
      ok: result.match,
      match: result.match,
      score: result.score,
      method: result.method,
      reason: result.reason,
      liveness_hint: result.liveness_hint,
      enrollment_id: enrollment.id,
      driver_name: enrollment.full_name,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Face verify failed",
      },
      { status: 500 }
    );
  }
}
