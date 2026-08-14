/** mAITab Android app — download paths (maiSociety-style). */

export const MAITAB_PRODUCTION_ORIGIN = "https://mai-tab.vercel.app";

export const MAITAB_ANDROID_APK_FILENAME = "maitab-latest.apk";

export const MAITAB_ANDROID_APK_PATH = `/downloads/${MAITAB_ANDROID_APK_FILENAME}`;

export const MAITAB_ANDROID_APK_URL = `${MAITAB_PRODUCTION_ORIGIN}${MAITAB_ANDROID_APK_PATH}`;

export const MAITAB_ANDROID_LANDING_PATH = "/downloads/android.html";

/** Landing with auto-start — camera QR scanners handle HTML reliably; raw APK often stalls in WebView. */
export const MAITAB_ANDROID_QR_PATH = `${MAITAB_ANDROID_LANDING_PATH}?autostart=1`;

export const MAITAB_ANDROID_QR_URL = `${MAITAB_PRODUCTION_ORIGIN}${MAITAB_ANDROID_QR_PATH}`;

export const MAITAB_ANDROID_DOWNLOAD_API = "/api/android-download";

export const MAITAB_CAPACITOR_APP_ID = "in.syncrasystems.maitab";

export const MAITAB_CAPACITOR_APP_NAME = "mAITab";

export function resolveAndroidOrigin(origin?: string) {
  return (
    origin ||
    (typeof window !== "undefined"
      ? window.location.origin
      : MAITAB_PRODUCTION_ORIGIN)
  );
}

export function resolveAndroidDownloadHref(origin?: string) {
  return `${resolveAndroidOrigin(origin)}${MAITAB_ANDROID_APK_PATH}`;
}

export function resolveAndroidQrHref(origin?: string) {
  return `${resolveAndroidOrigin(origin)}${MAITAB_ANDROID_QR_PATH}`;
}
