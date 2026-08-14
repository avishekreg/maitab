import { NextRequest, NextResponse } from "next/server";
import { MAITAB_ANDROID_APK_PATH } from "@/lib/android-app";

/** Redirect to the static APK asset (attachment headers applied in next.config). */
export async function GET(request: NextRequest) {
  const url = new URL(MAITAB_ANDROID_APK_PATH, request.url);
  return NextResponse.redirect(url, 307);
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
