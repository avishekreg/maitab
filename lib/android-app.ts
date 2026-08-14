/** mAITab Android app — download paths (maiSociety-style). */

export const MAITAB_PRODUCTION_ORIGIN = "https://mai-tab.vercel.app";

export const MAITAB_ANDROID_APK_FILENAME = "maitab-latest.apk";

export const MAITAB_ANDROID_APK_PATH = `/downloads/${MAITAB_ANDROID_APK_FILENAME}`;

export const MAITAB_ANDROID_APK_URL = `${MAITAB_PRODUCTION_ORIGIN}${MAITAB_ANDROID_APK_PATH}`;

export const MAITAB_ANDROID_LANDING_PATH = "/downloads/android.html";

export const MAITAB_CAPACITOR_APP_ID = "in.syncrasystems.maitab";

export const MAITAB_CAPACITOR_APP_NAME = "mAITab";

export function resolveAndroidDownloadHref(origin?: string) {
  const base =
    origin ||
    (typeof window !== "undefined"
      ? window.location.origin
      : MAITAB_PRODUCTION_ORIGIN);
  return `${base}${MAITAB_ANDROID_APK_PATH}`;
}
