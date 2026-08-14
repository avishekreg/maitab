export type ConfigCategory =
  | "PAYMENTS"
  | "MESSAGING"
  | "MAPS"
  | "AI"
  | "FEATURE_FLAGS"
  | "GEO";

export interface SystemConfigItem {
  id: string;
  config_key: string;
  category: ConfigCategory;
  label: string;
  value_encrypted: string;
  value_json: Record<string, unknown>;
  is_secret: boolean;
  updated_at: string;
}

export const DEFAULT_SYSTEM_CONFIGS: SystemConfigItem[] = [
  {
    id: "c-rz-id",
    config_key: "payments.razorpay.key_id",
    category: "PAYMENTS",
    label: "Primary Settlement Gateway Key ID",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-rz-sec",
    config_key: "payments.razorpay.key_secret",
    category: "PAYMENTS",
    label: "Primary Settlement Gateway Secret",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-cf-id",
    config_key: "payments.cashfree.app_id",
    category: "PAYMENTS",
    label: "Secondary Settlement Gateway App ID",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-cf-sec",
    config_key: "payments.cashfree.secret",
    category: "PAYMENTS",
    label: "Secondary Settlement Gateway Secret",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-merchant",
    config_key: "payments.merchant_id",
    category: "PAYMENTS",
    label: "Merchant ID",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-preauth",
    config_key: "payments.preauth_limit",
    category: "PAYMENTS",
    label: "Pre-Auth Limit (INR)",
    value_encrypted: "",
    value_json: { amount: 10 },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-tw-sid",
    config_key: "messaging.twilio.account_sid",
    category: "MESSAGING",
    label: "Twilio Account SID",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-tw-tok",
    config_key: "messaging.twilio.auth_token",
    category: "MESSAGING",
    label: "Twilio Auth Token",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-gup",
    config_key: "messaging.gupshup.api_key",
    category: "MESSAGING",
    label: "Gupshup API Key",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-wa",
    config_key: "messaging.whatsapp.cloud_token",
    category: "MESSAGING",
    label: "WhatsApp Cloud Token",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-gmaps",
    config_key: "maps.google.api_key",
    category: "MAPS",
    label: "Google Maps API Key",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-mapbox",
    config_key: "maps.mapbox.token",
    category: "MAPS",
    label: "Mapbox Token",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-openai",
    config_key: "ai.openai.api_key",
    category: "AI",
    label: "OpenAI API Key",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-vapi",
    config_key: "ai.vapi.token",
    category: "AI",
    label: "Vapi Token",
    value_encrypted: "",
    value_json: {},
    is_secret: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-webhook",
    config_key: "ai.custom.webhook",
    category: "AI",
    label: "Custom Voice Webhook",
    value_encrypted: "",
    value_json: { url: "" },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-radius",
    config_key: "geo.lockout_radius_m",
    category: "GEO",
    label: "Geo Competitor Lockout Radius (m)",
    value_encrypted: "",
    value_json: { radius_m: 1500 },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-flag-lucky",
    config_key: "flags.lucky_draw_global",
    category: "FEATURE_FLAGS",
    label: "Lucky Draw Engine",
    value_encrypted: "",
    value_json: { enabled: true },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-flag-av",
    config_key: "flags.av_takeover",
    category: "FEATURE_FLAGS",
    label: "AV Screen Takeover",
    value_encrypted: "",
    value_json: { enabled: true },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: "c-flag-hold",
    config_key: "flags.micro_hold_enforcement",
    category: "FEATURE_FLAGS",
    label: "Micro-Hold Pre-Auth",
    value_encrypted: "",
    value_json: { enabled: true },
    is_secret: false,
    updated_at: new Date().toISOString(),
  },
];

export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
}
