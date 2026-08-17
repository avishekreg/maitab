"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  MAITAB_ANDROID_DOWNLOAD_API,
  MAITAB_ANDROID_DOWNLOAD_FILENAME,
} from "@/lib/android-app";

const BADGE_IMG_STYLE: CSSProperties = { borderRadius: "8px" };
const BADGE_IMG_CLASS =
  "block h-10 w-[135px] max-w-full rounded-md object-cover overflow-hidden";
const BADGE_IMG_CLASS_FULL =
  "block h-12 w-[172px] max-w-full rounded-md object-cover overflow-hidden";

type FooterAppStoreBadgesProps = {
  align?: "left" | "center";
  stacked?: boolean;
  hideHeading?: boolean;
};

export function FooterAppStoreBadges({
  align = "left",
  stacked = false,
  hideHeading = false,
}: FooterAppStoreBadgesProps) {
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const badgeImgClass = stacked ? BADGE_IMG_CLASS : BADGE_IMG_CLASS_FULL;
  const alignClass =
    align === "center" ? "items-center text-center" : "items-start text-left";

  useEffect(() => {
    if (!iosModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIosModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [iosModalOpen]);

  return (
    <>
      <div className={`flex w-full flex-col space-y-2 lg:w-auto ${alignClass}`}>
        {!hideHeading && (
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300/60">
            Get the app
          </p>
        )}

        <div
          className={
            stacked
              ? "flex w-full flex-col items-start space-y-1.5"
              : "flex flex-nowrap items-center gap-3 sm:gap-4"
          }
          role="group"
          aria-label="Download mAITab mobile apps"
        >
          <a
            href={MAITAB_ANDROID_DOWNLOAD_API}
            download={MAITAB_ANDROID_DOWNLOAD_FILENAME}
            className="inline-flex items-center gap-2.5"
            aria-label="Download the mAITab Android APK"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              className="h-10 w-10 rounded-xl shadow-[0_8px_20px_rgba(124,58,237,0.35)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/google-play.svg"
              alt="Get it on Google Play"
              className={badgeImgClass}
              style={BADGE_IMG_STYLE}
            />
          </a>
          <button
            type="button"
            onClick={() => setIosModalOpen(true)}
            className="inline-block border-0 bg-transparent p-0"
            aria-label="Download on the App Store — coming soon"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/app-store.svg"
              alt="Download on the App Store"
              className={badgeImgClass}
              style={BADGE_IMG_STYLE}
            />
          </button>
        </div>
      </div>

      {iosModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIosModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12151A] p-6 text-[#E7E5E4] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-coming-soon-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A855F7]">
              iOS app
            </p>
            <h2
              id="ios-coming-soon-title"
              className="mt-2 font-sans text-xl font-semibold tracking-tight text-white"
            >
              Coming soon
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              The mAITab iOS app is in development. Android is available now — or
              use the web platform on Safari in the meantime.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={MAITAB_ANDROID_DOWNLOAD_API}
                download={MAITAB_ANDROID_DOWNLOAD_FILENAME}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-sm font-semibold text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192.png"
                  alt=""
                  className="h-7 w-7 rounded-lg"
                />
                Download Android APK
              </a>
              <button
                type="button"
                onClick={() => setIosModalOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
