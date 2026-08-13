"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface MemberPassQRProps {
  /** Signed HMAC pass token (preferred) or raw payload string. */
  value: string;
  size?: number;
  className?: string;
}

/**
 * Standards-compliant QR (ISO/IEC 18004) rendered via the `qrcode` library
 * so Gate Scanner (`html5-qrcode`) can decode Member Pass tokens reliably.
 */
export function MemberPassQR({
  value,
  size = 208,
  className,
}: MemberPassQRProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setDataUrl(null);
      return;
    }

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size,
      color: { dark: "#08090C", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("QR encode failed");
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        role="img"
        aria-label="QR error"
      >
        <p className="text-center text-xs text-accent-ruby">{error}</p>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-lg bg-black/10 ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt="mAITab Member Pass QR"
      className={className}
    />
  );
}
