import { NextResponse } from "next/server";
import { MAITAB_PRODUCTION_ORIGIN } from "@/lib/android-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy path — send scanners and old badges to the canonical attachment route. */
export async function GET() {
  return NextResponse.redirect(
    `${MAITAB_PRODUCTION_ORIGIN}/api/download/apk`,
    307
  );
}

export async function HEAD() {
  return NextResponse.redirect(
    `${MAITAB_PRODUCTION_ORIGIN}/api/download/apk`,
    307
  );
}
