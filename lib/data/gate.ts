import type { GateEntryEvent, SpendTier } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured, NEON_CLUB_ID } from "@/lib/supabase/env";
import { publishBus } from "@/lib/realtime/bus";
import { triggerMicroHold } from "@/lib/payments/autopay";

export async function emitGateEntry(input: {
  clubId?: string;
  userId: string;
  guestName: string;
  spendTier: SpendTier;
  mandateId?: string | null;
}): Promise<{
  event: GateEntryEvent;
  microHold: Awaited<ReturnType<typeof triggerMicroHold>>;
}> {
  const clubId = input.clubId ?? NEON_CLUB_ID;
  const microHold = await triggerMicroHold(input.mandateId ?? "");

  const event: GateEntryEvent = {
    id: `ge-${crypto.randomUUID()}`,
    club_id: clubId,
    user_id: input.userId,
    guest_name: input.guestName,
    spend_tier: input.spendTier,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("gate_entry_events")
        .insert({
          club_id: clubId,
          user_id: input.userId,
          guest_name: input.guestName,
          spend_tier: input.spendTier,
          micro_hold_ok: microHold.ok,
        })
        .select("*")
        .single();

      if (!error && data) {
        event.id = String(data.id);
        event.created_at = String(data.created_at);
      } else if (error) {
        console.error("emitGateEntry", error.message);
      }
    }
  }

  // Always publish for local multi-tab sync; Supabase Realtime covers cross-device.
  publishBus("gate_entry_events", "INSERT", event);
  return { event, microHold };
}

export async function fetchRecentGateEvents(
  clubId = NEON_CLUB_ID
): Promise<GateEntryEvent[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("gate_entry_events")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("fetchRecentGateEvents", error.message);
    return null;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    club_id: String(row.club_id),
    user_id: String(row.user_id),
    guest_name: String(row.guest_name),
    spend_tier: row.spend_tier as SpendTier,
    created_at: String(row.created_at),
  }));
}
