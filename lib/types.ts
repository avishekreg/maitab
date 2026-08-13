export type UserRole =
  | "SUPER_ADMIN"
  | "CLUB_ADMIN"
  | "GATE_STAFF"
  | "BARTENDER"
  | "AV_CONTROLLER"
  | "CUSTOMER";

export type SpendTier = "BRONZE" | "SILVER" | "GOLD" | "TITAN";

export type AutopayStatus = "ACTIVE" | "FAILED" | "PENDING";

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "MERGED_PARENT"
  | "MERGED_CHILD"
  | "PRE_BOOKED";

export type SessionStatus = "ACTIVE" | "COMPLETED" | "AUTO_SETTLED_EXITED";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED";

export type GameType =
  | "ROULETTE"
  | "TRUTH_OR_SHOT"
  | "DARE_WHEEL"
  | "NEVER_HAVE_I_EVER"
  | "SPIN_THE_BOTTLE"
  | "MOST_LIKELY_TO";

export type ExternalProvider =
  | "ZOMATO_DISTRICT"
  | "SWIGGY_DINEOUT"
  | "EAZYDINER"
  | "DIRECT"
  | "NONE";

export type DiscountStatus =
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED";

export interface FavoriteDrink {
  name: string;
  category?: string;
  times_ordered?: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  category?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  global_spend_tier: SpendTier;
  favorite_drinks: FavoriteDrink[];
  autopay_mandate_id: string | null;
  autopay_status: AutopayStatus;
  lifetime_visits: number;
  club_id: string | null;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  location: { lat: number; lng: number } | null;
  lucky_draw_threshold_amount: number;
  active_promo_category: string | null;
  display_enabled: boolean;
  lucky_draw_enabled: boolean;
  prebook_buffer_minutes: number;
  subscription_tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  created_at: string;
}

export interface ClubTable {
  id: string;
  club_id: string;
  table_code: string;
  status: TableStatus;
  parent_table_id: string | null;
  prebooked_at: string | null;
  prebook_slot_start: string | null;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  club_id: string;
  primary_table_id: string;
  total_session_spend: number;
  is_lucky_draw_eligible: boolean;
  is_vip: boolean;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  /** Phase 6 — external deal bridge */
  external_provider: ExternalProvider;
  external_voucher_code: string | null;
  discount_percentage: number;
  discount_status: DiscountStatus | null;
  discount_verified_by: string | null;
  is_native_promos_eligible: boolean;
}

export interface Order {
  id: string;
  session_id: string;
  club_id: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  token_number: number;
  created_at: string;
  ready_at: string | null;
}

export interface GamePoolItem {
  id: string;
  title: string;
  game_type: GameType;
  rules_json: Record<string, unknown>;
  is_active: boolean;
}

export interface GateEntryEvent {
  id: string;
  club_id: string;
  user_id: string;
  guest_name: string;
  spend_tier: SpendTier;
  created_at: string;
}

export interface PlatformMetrics {
  total_gmv: number;
  active_clubs: number;
  fraud_flags_24h: number;
  subscriptions: Record<string, number>;
}

export const ROLE_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin/super",
  CLUB_ADMIN: "/admin/club",
  GATE_STAFF: "/gate",
  BARTENDER: "/kds",
  AV_CONTROLLER: "/av-panel",
  CUSTOMER: "/home",
};

export const TIER_RANK: Record<SpendTier, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  TITAN: 4,
};
