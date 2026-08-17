import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { NextResponse } from "next/server";
import {
  MAITAB_ANDROID_APK_FILENAME,
  MAITAB_ANDROID_DOWNLOAD_FILENAME,
  MAITAB_PRODUCTION_ORIGIN,
} from "@/lib/android-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apkPath() {
  return path.join(
    process.cwd(),
    "public",
    "downloads",
    MAITAB_ANDROID_APK_FILENAME
  );
}

function attachmentHeaders(size?: number) {
  return {
    "Content-Type": "application/vnd.android.package-archive",
    "Content-Disposition": `attachment; filename="${MAITAB_ANDROID_DOWNLOAD_FILENAME}"`,
    ...(typeof size === "number" ? { "Content-Length": String(size) } : {}),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  };
}

/** Public APK download with attachment headers so a camera scan starts a file save. */
export async function GET() {
  const filePath = apkPath();
  if (!existsSync(filePath)) {
    return NextResponse.redirect(`${MAITAB_PRODUCTION_ORIGIN}/login`);
  }

  const { size } = statSync(filePath);
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: attachmentHeaders(size),
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
    headers: attachmentHeaders(size),
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
