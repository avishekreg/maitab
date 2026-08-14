"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { DarkGlassTelemetry } from "@/components/analytics/dark-glass-telemetry";

export default function ClubAnalyticsPage() {
  return (
    <AdminShell role="CLUB_ADMIN" title="Venue analytics" hideTitle>
      <DarkGlassTelemetry scope="venue" />
    </AdminShell>
  );
}
