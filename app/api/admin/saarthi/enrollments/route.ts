import { NextResponse } from "next/server";
import {
  getEnrollment,
  listEnrollments,
  setEnrollmentStatus,
} from "@/lib/saarthi/enrollment";

export const runtime = "nodejs";

/** Super Admin — list all mAISaarthi driver enrollments (with photo previews). */
export async function GET() {
  const rows = listEnrollments().map((e) => ({
    id: e.id,
    full_name: e.full_name,
    phone: e.phone,
    email: e.email,
    dl_number: e.dl_number,
    dl_expiry: e.dl_expiry,
    aadhaar_number: e.aadhaar_number,
    police_verification_status: e.police_verification_status,
    enrolled_at: e.enrolled_at,
    last_face_verify_at: e.last_face_verify_at,
    last_face_verify_score: e.last_face_verify_score,
    photos: e.photos.map((p) => ({
      kind: p.kind,
      data_url: p.data_url,
      telemetry: p.telemetry,
    })),
  }));
  return NextResponse.json({ ok: true, enrollments: rows });
}

/** Super Admin — approve or deny an enrollment. */
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      status?: "VERIFIED" | "REJECTED" | "PENDING";
      note?: string;
    };
    if (!body.id || !body.status) {
      return NextResponse.json(
        { ok: false, error: "id and status required" },
        { status: 400 }
      );
    }
    if (!["VERIFIED", "REJECTED", "PENDING"].includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status" },
        { status: 400 }
      );
    }
    const updated = setEnrollmentStatus(body.id, body.status, body.note);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      enrollment: {
        id: updated.id,
        full_name: updated.full_name,
        police_verification_status: updated.police_verification_status,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Update failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Convenience: fetch one by id
  const body = (await req.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }
  const e = getEnrollment(body.id);
  if (!e) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, enrollment: e });
}
