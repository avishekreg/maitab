"use client";

import { BrandLockup } from "@/components/branding/brand-lockup";
import { QRCodeCanvas } from "qrcode.react";
import type { CollateralTemplate } from "@/lib/assets/qr-studio";
import { cn } from "@/lib/utils";

export function QrCollateralCard({
  identifier,
  section,
  url,
  template,
  cardId,
}: {
  identifier: string;
  section: string;
  url: string;
  template: CollateralTemplate;
  cardId?: string;
}) {
  const copy =
    template === "gate"
      ? "Scan to activate Fast-Pass and enter the floor"
      : template === "bar"
        ? "Scan for Quick-Pour · bartender KDS in seconds"
        : template === "valet"
          ? "Scan to book a verified mAI Saarthi chauffeur"
          : "Scan with Phone Camera to Open Live Tab, Order Drinks & Auto-Pay";

  return (
    <div
      id={cardId}
      className={cn(
        "flex flex-col items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center",
        template === "gate" && "min-h-[520px] justify-between",
        template === "bar" && "min-h-[420px]",
        template === "valet" && "min-h-[280px]",
        template === "tent" && "min-h-[360px] w-[280px]",
      )}
    >
      <BrandLockup as="mark" />
      <div className="my-5 rounded-2xl border border-cyan-400/40 p-3 shadow-[0_0_28px_rgba(6,182,212,0.35)]">
        <div className="rounded-xl bg-white p-2">
          <QRCodeCanvas value={url} size={template === "gate" ? 220 : 168} level="H" includeMargin />
        </div>
      </div>
      <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
        {identifier} • {section}
      </h2>
      <p className="mt-2 max-w-[240px] text-xs font-medium leading-relaxed text-zinc-400">
        {copy}
      </p>
      <p className="mt-4 font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Powered by mAITab • Zero Waiting
      </p>
    </div>
  );
}
