/**
 * Layer 2 helpers — map permanent guest ↔ nightly venue attachment
 * into the guest UI session shape.
 */

import {
  clubNameForId,
  getAttachmentBySession,
  getGuestProfile,
  getOpenAttachment,
  listNightHistory,
  upsertNightAttachment,
  type GuestNightAttachment,
  type GuestProfile,
} from "@/lib/auth/guest-identity";
import { DEMO_CLUB, DEMO_CUSTOMER, DEMO_SESSION, DEMO_TABLES } from "@/lib/demo/data";
import type { ActiveSession, Order, UserProfile } from "@/lib/types";

export function guestToUserProfile(guest: GuestProfile): UserProfile {
  const tierMap = {
    STANDARD: "BRONZE" as const,
    GOLD: "GOLD" as const,
    BLACK_DIAMOND: "TITAN" as const,
  };
  return {
    id: guest.id,
    full_name: guest.full_name,
    phone_number: guest.phone || "",
    role: "CUSTOMER",
    global_spend_tier: tierMap[guest.vip_tier],
    favorite_drinks: DEMO_CUSTOMER.favorite_drinks,
    autopay_mandate_id: DEMO_CUSTOMER.autopay_mandate_id,
    autopay_status: "ACTIVE",
    lifetime_visits: guest.lifetime_visits,
    club_id: null,
    created_at: guest.created_at,
    loyalty_points: guest.loyalty_points,
    lifetime_spend: guest.lifetime_spend,
    vip_tier: guest.vip_tier,
    email: guest.email,
    passkey_enrolled: Boolean(guest.passkey),
  };
}

export function attachmentToSession(
  att: GuestNightAttachment
): ActiveSession {
  return {
    ...DEMO_SESSION,
    id: att.session_id,
    user_id: att.guest_profile_id,
    club_id: att.club_id,
    primary_table_id: att.table_id,
    total_session_spend: att.total_session_spend,
    status: att.status === "CLOSED" ? "COMPLETED" : "ACTIVE",
    started_at: att.opened_at,
    ended_at: att.closed_at,
    is_vip: true,
  };
}

export function resolveVenueMeta(clubId: string, tableId: string, tableCode: string) {
  const table =
    DEMO_TABLES.find((t) => t.id === tableId) ||
    DEMO_TABLES.find((t) => t.table_code === tableCode);
  return {
    club_id: clubId,
    club_name:
      clubId === DEMO_CLUB.id ? DEMO_CLUB.name : clubNameForId(clubId),
    table_id: table?.id ?? tableId,
    table_code: table?.table_code ?? tableCode,
  };
}

export function attachGuestToVenue(params: {
  guestId: string;
  clubId: string;
  tableId: string;
  tableCode: string;
  sessionId?: string;
}): GuestNightAttachment {
  const venue = resolveVenueMeta(
    params.clubId,
    params.tableId,
    params.tableCode
  );
  return upsertNightAttachment({
    session_id: params.sessionId || crypto.randomUUID(),
    guest_profile_id: params.guestId,
    club_id: venue.club_id,
    club_name: venue.club_name,
    table_id: venue.table_id,
    table_code: venue.table_code,
    status: "OPEN",
  });
}

export function buildGuestHydration(guestId: string) {
  const guest = getGuestProfile(guestId);
  if (!guest) return null;
  const open = getOpenAttachment(guestId);
  const history = listNightHistory(guestId);
  return {
    user: guestToUserProfile(guest),
    session: open ? attachmentToSession(open) : null,
    venue: open
      ? {
          club_id: open.club_id,
          club_name: open.club_name,
          table_id: open.table_id,
          table_code: open.table_code,
        }
      : null,
    history,
    orders: [] as Order[],
  };
}

export function buildGuestHydrationBySession(sessionId: string) {
  const att = getAttachmentBySession(sessionId);
  if (!att) return null;
  return buildGuestHydration(att.guest_profile_id);
}
