/**
 * mAISaarthi driver enrollment + face-verify telemetry.
 * Demo store: in-memory. Production would use encrypted object storage +
 * a dedicated face SDK (FaceTec / AWS Rekognition / Azure Face).
 */

export type CaptureTelemetry = {
  captured_at: string; // ISO-8601
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  altitude_m: number | null;
  heading: number | null;
  user_agent: string;
  timezone: string;
};

export type EnrollmentPhotoKind =
  | "DL_FRONT"
  | "DL_BACK"
  | "AADHAAR_FRONT"
  | "AADHAAR_BACK"
  | "SELFIE"
  | "PCC";

export type EnrollmentPhoto = {
  kind: EnrollmentPhotoKind;
  data_url: string;
  telemetry: CaptureTelemetry;
};

/** Photos required before enrollment can be submitted. */
export const REQUIRED_ENROLLMENT_PHOTO_KINDS: EnrollmentPhotoKind[] = [
  "DL_FRONT",
  "DL_BACK",
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "SELFIE",
  "PCC",
];

export type DriverEnrollment = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dl_number: string;
  dl_expiry: string;
  /** 12-digit Aadhaar (stored for Super Admin verification; mask in guest UI). */
  aadhaar_number: string;
  photos: EnrollmentPhoto[];
  /** Compact fingerprint of enrollment selfie for demo matching */
  selfie_fingerprint: string;
  police_verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  enrolled_at: string;
  last_face_verify_at: string | null;
  last_face_verify_score: number | null;
};

export function normalizeAadhaar(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidAadhaar(raw: string): boolean {
  return /^\d{12}$/.test(normalizeAadhaar(raw));
}

export function maskAadhaar(raw: string): string {
  const n = normalizeAadhaar(raw);
  if (n.length !== 12) return "••••";
  return `XXXX-XXXX-${n.slice(8)}`;
}

let enrollments: DriverEnrollment[] = [];

/** Simple perceptual-ish fingerprint from base64 length + sample chars (demo). */
export function fingerprintDataUrl(dataUrl: string): string {
  const raw = dataUrl.slice(0, 8000);
  let h = 0;
  for (let i = 0; i < raw.length; i += 17) {
    h = (h * 33 + raw.charCodeAt(i)) >>> 0;
  }
  return `fp_${h.toString(16)}_${raw.length}`;
}

export function listEnrollments(): DriverEnrollment[] {
  return enrollments;
}

export function getEnrollment(id: string): DriverEnrollment | undefined {
  return enrollments.find((e) => e.id === id);
}

export function getEnrollmentByPhone(phone: string): DriverEnrollment | undefined {
  const n = phone.replace(/\D/g, "");
  return enrollments.find((e) => e.phone.replace(/\D/g, "") === n);
}

export function createEnrollment(input: {
  full_name: string;
  phone: string;
  email?: string | null;
  dl_number: string;
  dl_expiry: string;
  aadhaar_number: string;
  photos: EnrollmentPhoto[];
}): DriverEnrollment {
  if (!isValidAadhaar(input.aadhaar_number)) {
    throw new Error("Valid 12-digit Aadhaar number is required");
  }

  for (const kind of REQUIRED_ENROLLMENT_PHOTO_KINDS) {
    if (!input.photos.find((p) => p.kind === kind)) {
      const label = kind.replace(/_/g, " ").toLowerCase();
      throw new Error(`${label} photo is required`);
    }
  }

  const selfie = input.photos.find((p) => p.kind === "SELFIE")!;

  const enrollment: DriverEnrollment = {
    id: crypto.randomUUID(),
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    dl_number: input.dl_number.trim().toUpperCase(),
    dl_expiry: input.dl_expiry,
    aadhaar_number: normalizeAadhaar(input.aadhaar_number),
    photos: input.photos,
    selfie_fingerprint: fingerprintDataUrl(selfie.data_url),
    police_verification_status: "PENDING",
    enrolled_at: new Date().toISOString(),
    last_face_verify_at: null,
    last_face_verify_score: null,
  };
  enrollments = [enrollment, ...enrollments];
  return enrollment;
}

export function recordFaceVerify(
  id: string,
  score: number
): DriverEnrollment | undefined {
  const e = enrollments.find((x) => x.id === id);
  if (!e) return undefined;
  e.last_face_verify_at = new Date().toISOString();
  e.last_face_verify_score = score;
  return e;
}

export function setEnrollmentStatus(
  id: string,
  status: DriverEnrollment["police_verification_status"],
  note?: string
): DriverEnrollment | undefined {
  const e = enrollments.find((x) => x.id === id);
  if (!e) return undefined;
  e.police_verification_status = status;
  if (note) {
    (e as DriverEnrollment & { review_note?: string }).review_note = note;
  }
  return e;
}

export function listEnrollmentsByStatus(
  status?: DriverEnrollment["police_verification_status"]
): DriverEnrollment[] {
  if (!status) return listEnrollments();
  return enrollments.filter((e) => e.police_verification_status === status);
}
