/**
 * Permanent guest identity (Layer 1) — in-memory demo store.
 * Production persists to guest_profiles / users via migration 16.
 */

export type VipTier = "STANDARD" | "GOLD" | "BLACK_DIAMOND";

export type NightSessionStatus =
  | "OPEN"
  | "SETTLING"
  | "CLOSED"
  | "ABANDONED";

export type GuestPasskeyCredential = {
  credentialId: string; // base64url
  publicKey: string; // base64url COSE / SPKI blob from SimpleWebAuthn
  counter: number;
  transports?: AuthenticatorTransport[];
};

export type GuestProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  passkey: GuestPasskeyCredential | null;
  loyalty_points: number;
  lifetime_spend: number;
  vip_tier: VipTier;
  lifetime_visits: number;
  created_at: string;
};

export type GuestNightRecord = {
  id: string;
  guest_profile_id: string;
  club_id: string;
  club_name: string;
  table_code: string;
  session_id: string;
  spend_amount: number;
  status: "SETTLED" | "OPEN" | "ABANDONED";
  saarthi_trip_id: string | null;
  night_at: string;
};

export type GuestNightAttachment = {
  session_id: string;
  guest_profile_id: string;
  club_id: string;
  club_name: string;
  table_id: string;
  table_code: string;
  status: NightSessionStatus;
  opened_at: string;
  closed_at: string | null;
  total_session_spend: number;
  order_summaries: { name: string; quantity: number; unit_price: number }[];
};

let profiles: GuestProfile[] = [];
let nights: GuestNightRecord[] = [];
let attachments: GuestNightAttachment[] = [];
/** WebAuthn challenge store: challenge → { userId?, type, exp } */
const challenges = new Map<
  string,
  { type: "reg" | "auth"; userId?: string; exp: number }
>();

function seedDemoHistory(guestId: string) {
  if (nights.some((n) => n.guest_profile_id === guestId)) return;
  nights = [
    {
      id: crypto.randomUUID(),
      guest_profile_id: guestId,
      club_id: "22222222-2222-2222-2222-222222222222",
      club_name: "Neon District",
      table_code: "VIP-04",
      session_id: crypto.randomUUID(),
      spend_amount: 8450,
      status: "SETTLED",
      saarthi_trip_id: crypto.randomUUID(),
      night_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      guest_profile_id: guestId,
      club_id: "22222222-2222-2222-2222-222222222224",
      club_name: "Neon Sky Lounge",
      table_code: "S-12",
      session_id: crypto.randomUUID(),
      spend_amount: 3200,
      status: "SETTLED",
      saarthi_trip_id: null,
      night_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
    ...nights,
  ];
}

export function createGuestProfile(input?: {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
}): GuestProfile {
  const profile: GuestProfile = {
    id: crypto.randomUUID(),
    full_name: input?.full_name?.trim() || "Guest",
    phone: input?.phone ?? null,
    email: input?.email ?? null,
    passkey: null,
    loyalty_points: 120,
    lifetime_spend: 11650,
    vip_tier: "GOLD",
    lifetime_visits: 2,
    created_at: new Date().toISOString(),
  };
  profiles = [profile, ...profiles];
  seedDemoHistory(profile.id);
  return profile;
}

export function getGuestProfile(id: string): GuestProfile | undefined {
  return profiles.find((p) => p.id === id);
}

export function getGuestByCredentialId(
  credentialId: string
): GuestProfile | undefined {
  return profiles.find((p) => p.passkey?.credentialId === credentialId);
}

export function listPasskeyCredentialIds(): string[] {
  return profiles
    .map((p) => p.passkey?.credentialId)
    .filter((id): id is string => Boolean(id));
}

export function savePasskey(
  guestId: string,
  passkey: GuestPasskeyCredential
): GuestProfile | undefined {
  const p = profiles.find((x) => x.id === guestId);
  if (!p) return undefined;
  p.passkey = passkey;
  return p;
}

export function bumpPasskeyCounter(
  guestId: string,
  counter: number
): void {
  const p = profiles.find((x) => x.id === guestId);
  if (p?.passkey) p.passkey.counter = counter;
}

export function listNightHistory(guestId: string): GuestNightRecord[] {
  return nights
    .filter((n) => n.guest_profile_id === guestId)
    .sort((a, b) => b.night_at.localeCompare(a.night_at));
}

export function putChallenge(
  challenge: string,
  meta: { type: "reg" | "auth"; userId?: string }
) {
  challenges.set(challenge, {
    ...meta,
    exp: Date.now() + 5 * 60 * 1000,
  });
}

export function takeChallenge(challenge: string) {
  const row = challenges.get(challenge);
  challenges.delete(challenge);
  if (!row || row.exp < Date.now()) return null;
  return row;
}

export function upsertNightAttachment(
  input: Omit<GuestNightAttachment, "opened_at" | "closed_at" | "order_summaries" | "total_session_spend" | "status"> & {
    status?: NightSessionStatus;
    total_session_spend?: number;
    order_summaries?: GuestNightAttachment["order_summaries"];
  }
): GuestNightAttachment {
  const existing = attachments.find(
    (a) =>
      a.guest_profile_id === input.guest_profile_id &&
      a.club_id === input.club_id &&
      a.table_id === input.table_id &&
      a.status === "OPEN"
  );
  if (existing) {
    existing.session_id = input.session_id;
    existing.table_code = input.table_code;
    existing.club_name = input.club_name;
    return existing;
  }
  const row: GuestNightAttachment = {
    session_id: input.session_id,
    guest_profile_id: input.guest_profile_id,
    club_id: input.club_id,
    club_name: input.club_name,
    table_id: input.table_id,
    table_code: input.table_code,
    status: input.status ?? "OPEN",
    opened_at: new Date().toISOString(),
    closed_at: null,
    total_session_spend: input.total_session_spend ?? 0,
    order_summaries: input.order_summaries ?? [],
  };
  attachments = [row, ...attachments];
  return row;
}

export function getOpenAttachment(
  guestId: string
): GuestNightAttachment | undefined {
  return attachments.find(
    (a) => a.guest_profile_id === guestId && a.status === "OPEN"
  );
}

export function getAttachmentBySession(
  sessionId: string
): GuestNightAttachment | undefined {
  return attachments.find((a) => a.session_id === sessionId);
}

export function clubNameForId(clubId: string): string {
  if (clubId.includes("224") || clubId.endsWith("224")) return "Neon Sky Lounge";
  if (clubId.includes("223")) return "Velvet Room";
  return "Neon District";
}
