"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptureTelemetry, EnrollmentPhoto } from "@/lib/saarthi/enrollment";

type Kind = EnrollmentPhoto["kind"];

async function readGeo(): Promise<Pick<
  CaptureTelemetry,
  "lat" | "lng" | "accuracy_m" | "altitude_m" | "heading"
>> {
  if (!navigator.geolocation) {
    return {
      lat: null,
      lng: null,
      accuracy_m: null,
      altitude_m: null,
      heading: null,
    };
  }
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy_m: pos.coords.accuracy ?? null,
      altitude_m: pos.coords.altitude ?? null,
      heading: pos.coords.heading ?? null,
    };
  } catch {
    return {
      lat: null,
      lng: null,
      accuracy_m: null,
      altitude_m: null,
      heading: null,
    };
  }
}

export function TelemetryCameraCapture({
  kind,
  label,
  facingMode = "environment",
  onCaptured,
}: {
  kind: Kind;
  label: string;
  facingMode?: "user" | "environment";
  onCaptured: (photo: EnrollmentPhoto) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  async function start() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera permission denied — enable camera to enroll.");
    }
  }

  async function snap() {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    setError(null);
    try {
      const geo = await readGeo();
      if (geo.lat == null || geo.lng == null) {
        setError("GPS required — enable location for enrollment photos.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Burn telemetry strip into the frame (audit watermark)
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, canvas.height - 56, canvas.width, 56);
      ctx.fillStyle = "#67e8f9";
      ctx.font = "16px monospace";
      const captured_at = new Date().toISOString();
      ctx.fillText(
        `${kind} · ${captured_at} · ${geo.lat.toFixed(5)},${geo.lng.toFixed(5)} ±${Math.round(geo.accuracy_m ?? 0)}m`,
        12,
        canvas.height - 22
      );
      const data_url = canvas.toDataURL("image/jpeg", 0.88);
      const telemetry: CaptureTelemetry = {
        captured_at,
        ...geo,
        user_agent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      setPreview(data_url);
      onCaptured({ kind, data_url, telemetry });
      stop();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">
        GPS + ISO timestamp burned into frame at capture.
      </p>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={label}
          className="mt-3 max-h-48 w-full rounded-xl object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          className="mt-3 aspect-video w-full rounded-xl bg-black object-cover"
        />
      )}

      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!stream && !preview ? (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100"
          >
            Open camera
          </button>
        ) : null}
        {stream ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void snap()}
            className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"
          >
            {busy ? "Capturing…" : "Capture with geo + time"}
          </button>
        ) : null}
        {preview ? (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              void start();
            }}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
          >
            Retake
          </button>
        ) : null}
      </div>
    </div>
  );
}
