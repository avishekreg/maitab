"use client";

import { useEffect, useState } from "react";
import {
  MAITAB_ANDROID_APK_FILENAME,
  resolveAndroidDownloadHref,
} from "@/lib/android-app";

type FooterAndroidQrProps = {
  size?: number;
  className?: string;
};

/**
 * QR encodes the attachment download API so a camera scan starts the APK
 * without an intermediate HTML page.
 */
export function FooterAndroidQr({
  size = 120,
  className = "",
}: FooterAndroidQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [downloadHref, setDownloadHref] = useState(resolveAndroidDownloadHref());

  useEffect(() => {
    setDownloadHref(resolveAndroidDownloadHref(window.location.origin));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(downloadHref, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: size * 2,
        color: {
          dark: "#12151A",
          light: "#FFFFFFFF",
        },
      })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setDataUrl(null);
        }),
    );

    return () => {
      cancelled = true;
    };
  }, [size, downloadHref]);

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <a
        href={downloadHref}
        download={MAITAB_ANDROID_APK_FILENAME}
        className="rounded-xl border border-white/15 bg-white p-2 shadow-sm transition hover:opacity-95"
        style={{ width: size + 16, height: size + 16 }}
        aria-label="Download the mAITab Android APK"
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            width={size}
            height={size}
            alt="QR code — scan to download the mAITab Android APK"
            className="block h-full w-full"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400"
            aria-hidden="true"
          >
            Loading QR…
          </div>
        )}
      </a>
      <p className="max-w-[9.5rem] text-xs leading-snug text-slate-300/70">
        Scan to download the Android APK instantly
      </p>
      <a
        href={downloadHref}
        download={MAITAB_ANDROID_APK_FILENAME}
        className="text-[11px] font-semibold text-[#A855F7] underline-offset-2 hover:underline"
      >
        Or tap to download
      </a>
    </div>
  );
}
