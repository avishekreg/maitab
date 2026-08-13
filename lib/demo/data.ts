import type {
  ActiveSession,
  Club,
  ClubTable,
  GateEntryEvent,
  Order,
  PlatformMetrics,
  UserProfile,
} from "@/lib/types";

export const DEMO_CUSTOMER: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  full_name: "Rahul Deshmukh",
  phone_number: "+919876543210",
  role: "CUSTOMER",
  global_spend_tier: "GOLD",
  favorite_drinks: [
    { name: "Heineken", category: "BEER", times_ordered: 18 },
    { name: "Espresso Martini", category: "COCKTAIL", times_ordered: 9 },
  ],
  autopay_mandate_id: "mandate_demo_rahul",
  autopay_status: "ACTIVE",
  lifetime_visits: 27,
  club_id: null,
  created_at: new Date().toISOString(),
};

export const DEMO_CLUB: Club = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Neon District",
  location: { lat: 19.076, lng: 72.8777 },
  lucky_draw_threshold_amount: 1500,
  active_promo_category: "BEER",
  display_enabled: true,
  lucky_draw_enabled: true,
  prebook_buffer_minutes: 30,
  subscription_tier: "GROWTH",
  created_at: new Date().toISOString(),
};

export const DEMO_TABLES: ClubTable[] = [
  {
    id: "b0000000-0000-0000-0000-000000000004",
    club_id: DEMO_CLUB.id,
    table_code: "B4",
    status: "MERGED_PARENT",
    parent_table_id: null,
    prebooked_at: null,
    prebook_slot_start: null,
  },
  {
    id: "b0000000-0000-0000-0000-000000000005",
    club_id: DEMO_CLUB.id,
    table_code: "B5",
    status: "MERGED_CHILD",
    parent_table_id: "b0000000-0000-0000-0000-000000000004",
    prebooked_at: null,
    prebook_slot_start: null,
  },
  {
    id: "b0000000-0000-0000-0000-000000000006",
    club_id: DEMO_CLUB.id,
    table_code: "B6",
    status: "MERGED_CHILD",
    parent_table_id: "b0000000-0000-0000-0000-000000000004",
    prebooked_at: null,
    prebook_slot_start: null,
  },
  {
    id: "v0000000-0000-0000-0000-000000000001",
    club_id: DEMO_CLUB.id,
    table_code: "V1",
    status: "PRE_BOOKED",
    parent_table_id: null,
    prebooked_at: new Date().toISOString(),
    prebook_slot_start: new Date(Date.now() + 25 * 60_000).toISOString(),
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    club_id: DEMO_CLUB.id,
    table_code: "B2",
    status: "AVAILABLE",
    parent_table_id: null,
    prebooked_at: null,
    prebook_slot_start: null,
  },
];

export const DEMO_SESSION: ActiveSession = {
  id: "33333333-3333-3333-3333-333333333333",
  user_id: DEMO_CUSTOMER.id,
  club_id: DEMO_CLUB.id,
  primary_table_id: "b0000000-0000-0000-0000-000000000004",
  total_session_spend: 2460,
  is_lucky_draw_eligible: true,
  is_vip: false,
  status: "ACTIVE",
  started_at: new Date(Date.now() - 72 * 60_000).toISOString(),
  ended_at: null,
};

export const DEMO_ORDERS: Order[] = [
  {
    id: "o-1",
    session_id: DEMO_SESSION.id,
    club_id: DEMO_CLUB.id,
    items: [
      { name: "Heineken", quantity: 2, unit_price: 350, category: "BEER" },
    ],
    total_amount: 700,
    status: "PREPARING",
    token_number: 204,
    created_at: new Date(Date.now() - 4 * 60_000).toISOString(),
    ready_at: null,
  },
  {
    id: "o-2",
    session_id: DEMO_SESSION.id,
    club_id: DEMO_CLUB.id,
    items: [
      {
        name: "Espresso Martini",
        quantity: 1,
        unit_price: 650,
        category: "COCKTAIL",
      },
      { name: "Tequila Shot", quantity: 4, unit_price: 280, category: "SHOT" },
    ],
    total_amount: 1770,
    status: "PENDING",
    token_number: 205,
    created_at: new Date(Date.now() - 90_000).toISOString(),
    ready_at: null,
  },
  {
    id: "o-3",
    session_id: "other",
    club_id: DEMO_CLUB.id,
    items: [{ name: "Corona", quantity: 3, unit_price: 380, category: "BEER" }],
    total_amount: 1140,
    status: "READY",
    token_number: 203,
    created_at: new Date(Date.now() - 10 * 60_000).toISOString(),
    ready_at: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
];

/** @deprecated Prefer LOCAL_GAMES_POOL / GAMES_CATALOG — 105-game Phase 5 library */
export { LOCAL_GAMES_POOL as DEMO_GAMES } from "@/lib/games/data";

export const DEMO_GATE_EVENTS: GateEntryEvent[] = [
  {
    id: "ge-1",
    club_id: DEMO_CLUB.id,
    user_id: DEMO_CUSTOMER.id,
    guest_name: "Rahul Deshmukh",
    spend_tier: "GOLD",
    created_at: new Date(Date.now() - 20_000).toISOString(),
  },
  {
    id: "ge-2",
    club_id: DEMO_CLUB.id,
    user_id: "u-titan",
    guest_name: "Aanya Kapoor",
    spend_tier: "TITAN",
    created_at: new Date(Date.now() - 90_000).toISOString(),
  },
];

export const DEMO_METRICS: PlatformMetrics = {
  total_gmv: 18450000,
  active_clubs: 42,
  fraud_flags_24h: 3,
  subscriptions: {
    STARTER: 18,
    GROWTH: 16,
    ENTERPRISE: 8,
  },
};

export const MENU_ITEMS = [
  { name: "Heineken", category: "BEER", unit_price: 350 },
  { name: "Corona", category: "BEER", unit_price: 380 },
  { name: "Espresso Martini", category: "COCKTAIL", unit_price: 650 },
  { name: "Old Fashioned", category: "COCKTAIL", unit_price: 720 },
  { name: "Tequila Shot", category: "SHOT", unit_price: 280 },
  { name: "Jägerbomb", category: "SHOT", unit_price: 320 },
] as const;
