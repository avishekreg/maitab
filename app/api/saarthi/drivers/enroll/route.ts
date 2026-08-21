import { NextResponse } from "next/server";
import {
  createEnrollment,
  listEnrollments,
  maskAadhaar,
  type CaptureTelemetry,
  type EnrollmentPhoto,
} from "@/lib/saarthi/enrollment";

export const runtime = "nodejs";

export async function GET() {
  const rows = listEnrollments().map((e) => ({
    id: e.id,
    full_name: e.full_name,
    phone: e.phone,
    dl_number: e.dl_number,
    aadhaar_masked: maskAadhaar(e.aadhaar_number),
    police_verification_status: e.police_verification_status,
    enrolled_at: e.enrolled_at,
    photo_kinds: e.photos.map((p) => p.kind),
    last_face_verify_at: e.last_face_verify_at,
    last_face_verify_score: e.last_face_verify_score,
  }));
  return NextResponse.json({ ok: true, enrollments: rows });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      full_name?: string;
      phone?: string;
      email?: string | null;
      dl_number?: string;
      dl_expiry?: string;
      aadhaar_number?: string;
      photos?: EnrollmentPhoto[];
    };

    if (
      !body.full_name?.trim() ||
      !body.phone?.trim() ||
      !body.dl_number?.trim() ||
      !body.dl_expiry ||
      !body.aadhaar_number?.trim() ||
      !Array.isArray(body.photos)
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing enrollment fields (include Aadhaar)" },
        { status: 400 }
      );
    }

    for (const photo of body.photos) {
      if (!photo?.data_url || !photo?.telemetry?.captured_at) {
        return NextResponse.json(
          {
            ok: false,
            error: "Each photo requires data_url and capture telemetry (time)",
          },
          { status: 400 }
        );
      }
      const t = photo.telemetry as CaptureTelemetry;
      if (t.lat == null || t.lng == null) {
        return NextResponse.json(
          {
            ok: false,
            error: "GPS latitude/longitude required on every enrollment photo",
          },
          { status: 400 }
        );
      }
    }

    const enrollment = createEnrollment({
      full_name: body.full_name,
      phone: body.phone,
      email: body.email,
      dl_number: body.dl_number,
      dl_expiry: body.dl_expiry,
      aadhaar_number: body.aadhaar_number,
      photos: body.photos,
    });

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: enrollment.id,
        full_name: enrollment.full_name,
        phone: enrollment.phone,
        police_verification_status: enrollment.police_verification_status,
        enrolled_at: enrollment.enrolled_at,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enroll failed" },
      { status: 400 }
    );
  }
}
