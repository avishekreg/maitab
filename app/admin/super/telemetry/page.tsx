"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { DarkGlassTelemetry } from "@/components/analytics/dark-glass-telemetry";

export default function SuperTelemetryPage() {
  return (
    <AdminShell role="SUPER_ADMIN" title="Liquor telemetry" hideTitle>
      <DarkGlassTelemetry scope="network" />
    </AdminShell>
  );
}
