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
  owner_group_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  credit_balance: 5000,
  short_name: "Neon District Main",
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
    id: "c0000000-0000-0000-0000-000000000001",
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
  external_provider: "NONE",
  external_voucher_code: null,
  discount_percentage: 0,
  discount_status: null,
  discount_verified_by: null,
  is_native_promos_eligible: true,
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
    token_number: 4829,
    pickup_token_code: "#4829",
    assigned_waiter_id: "waiter-priya-001",
    assigned_waiter_name: "Priya Nair",
    assigned_counter_id: "bc000000-0000-0000-0000-000000000001",
    assigned_counter_name: "Main Bar (Counter 1)",
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
    token_number: 7153,
    pickup_token_code: "#7153",
    assigned_waiter_id: "waiter-priya-001",
    assigned_waiter_name: "Priya Nair",
    assigned_counter_id: "bc000000-0000-0000-0000-000000000001",
    assigned_counter_name: "Main Bar (Counter 1)",
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
    token_number: 3901,
    pickup_token_code: "#3901",
    assigned_waiter_id: "waiter-priya-001",
    assigned_waiter_name: "Priya Nair",
    assigned_counter_id: "bc000000-0000-0000-0000-000000000001",
    assigned_counter_name: "Main Bar (Counter 1)",
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

/**
 * Unique venue catalog. Names come from landing copy (Heineken KDS token,
 * BEER flash lockouts) plus the Surprise Games penalty catalog. No repeats.
 */
export const MENU_ITEMS = [
  { name: "Heineken", category: "BEER", unit_price: 350 },
  { name: "Corona", category: "BEER", unit_price: 380 },
  { name: "Kingfisher Ultra", category: "BEER", unit_price: 320 },
  { name: "Bira Blonde", category: "BEER", unit_price: 300 },
  { name: "Hoegaarden", category: "BEER", unit_price: 390 },
  { name: "Budweiser Magnum", category: "BEER", unit_price: 360 },
  { name: "Espresso Martini", category: "COCKTAIL", unit_price: 650 },
  { name: "Old Fashioned", category: "COCKTAIL", unit_price: 720 },
  { name: "Gin & Tonic", category: "COCKTAIL", unit_price: 520 },
  { name: "Whiskey Sour", category: "COCKTAIL", unit_price: 680 },
  { name: "Classic Mojito", category: "COCKTAIL", unit_price: 550 },
  { name: "Negroni", category: "COCKTAIL", unit_price: 700 },
  { name: "Long Island Iced Tea", category: "COCKTAIL", unit_price: 780 },
  { name: "Cosmopolitan", category: "COCKTAIL", unit_price: 640 },
  { name: "Tequila Shot", category: "SHOT", unit_price: 280 },
  { name: "Vodka Shot", category: "SHOT", unit_price: 260 },
  { name: "Jägerbomb", category: "SHOT", unit_price: 450 },
  { name: "Kamikaze", category: "SHOT", unit_price: 300 },
  { name: "Fireball Shot", category: "SHOT", unit_price: 290 },
  { name: "Fresh Lime Soda", category: "SOFT", unit_price: 180 },
  { name: "Red Bull", category: "SOFT", unit_price: 250 },
  { name: "Coconut Water", category: "SOFT", unit_price: 160 },
  { name: "Truffle Fries", category: "BITES", unit_price: 420 },
  { name: "Loaded Nachos", category: "BITES", unit_price: 480 },
  { name: "Chicken Wings", category: "BITES", unit_price: 520 },
] as const;
