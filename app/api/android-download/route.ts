import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { NextResponse } from "next/server";
import { MAITAB_ANDROID_APK_FILENAME } from "@/lib/android-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apkPath() {
  return path.join(process.cwd(), "public", "downloads", MAITAB_ANDROID_APK_FILENAME);
}

/** Public APK download with attachment headers so QR / Play taps start a file save. */
export async function GET() {
  const filePath = apkPath();
  if (!existsSync(filePath)) {
    return NextResponse.json(
      { ok: false, error: "Android APK not found" },
      { status: 404 }
    );
  }

  const { size } = statSync(filePath);
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${MAITAB_ANDROID_APK_FILENAME}"`,
      "Content-Length": String(size),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function HEAD() {
  const filePath = apkPath();
  if (!existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }
  const { size } = statSync(filePath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${MAITAB_ANDROID_APK_FILENAME}"`,
      "Content-Length": String(size),
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
