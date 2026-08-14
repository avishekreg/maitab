"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { DarkGlassTelemetry } from "@/components/analytics/dark-glass-telemetry";

export default function SuperTelemetryPage() {
  return (
    <AdminShell
      role="SUPER_ADMIN"
      title="Liquor telemetry"
      subtitle="Network-wide pour velocity, share of throat, and leakage radar."
    >
      <DarkGlassTelemetry scope="network" hideHeading />
    </AdminShell>
  );
}
