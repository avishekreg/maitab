import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { MAITAB_ANDROID_APK_FILENAME } from "@/lib/android-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public APK download with attachment headers (works when static headers are stripped). */
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "downloads",
      MAITAB_ANDROID_APK_FILENAME
    );
    const body = await readFile(filePath);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${MAITAB_ANDROID_APK_FILENAME}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Android APK not found" },
      { status: 404 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
