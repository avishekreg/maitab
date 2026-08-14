import { encryptSecret, revealOrMaskSecret } from "@/lib/crypto/secrets";

export type ConfigGroup =
  | "API_ENDPOINTS"
  | "WEBHOOK_URLS"
  | "COMMISSION_RATES"
  | "GLOBAL_KEYS"
  | "PAYMENT_GATEWAY_CREDENTIALS";

export interface PlatformConfigRow {
  id: string;
  config_key: string;
  config_group: ConfigGroup;
  label: string;
  value_encrypted: string;
  is_secret: boolean;
  updated_at: string;
}

const DEFAULTS: Omit<PlatformConfigRow, "id" | "updated_at">[] = [
  {
    config_key: "SETTLEMENT_GATEWAY_PRIMARY",
    config_group: "PAYMENT_GATEWAY_CREDENTIALS",
    label: "Primary Settlement Gateway Key",
    value_encrypted: "",
    is_secret: true,
  },
  {
    config_key: "SETTLEMENT_GATEWAY_SECONDARY",
    config_group: "PAYMENT_GATEWAY_CREDENTIALS",
    label: "Secondary Settlement Gateway Key",
    value_encrypted: "",
    is_secret: true,
  },
  {
    config_key: "WEBHOOK_ORDERS",
    config_group: "WEBHOOK_URLS",
    label: "Orders Webhook URL",
    value_encrypted: "",
    is_secret: false,
  },
  {
    config_key: "WEBHOOK_SETTLEMENT",
    config_group: "WEBHOOK_URLS",
    label: "Settlement Webhook URL",
    value_encrypted: "",
    is_secret: false,
  },
  {
    config_key: "API_KDS_BASE",
    config_group: "API_ENDPOINTS",
    label: "KDS API Base URL",
    value_encrypted: "",
    is_secret: false,
  },
  {
    config_key: "COMMISSION_STARTER_PCT",
    config_group: "COMMISSION_RATES",
    label: "Starter GMV Commission %",
    value_encrypted: "1.5",
    is_secret: false,
  },
  {
    config_key: "COMMISSION_PRO_PCT",
    config_group: "COMMISSION_RATES",
    label: "Pro GMV Commission %",
    value_encrypted: "1.0",
    is_secret: false,
  },
];

let rows: PlatformConfigRow[] = DEFAULTS.map((d, i) => ({
  ...d,
  id: `pc-${i + 1}`,
  updated_at: new Date().toISOString(),
}));

export function listPlatformConfigDemo(): PlatformConfigRow[] {
  return rows.map((r) => ({ ...r }));
}

export function publicPlatformConfig(reveal = false) {
  return listPlatformConfigDemo().map((r) => ({
    ...r,
    value_encrypted: r.is_secret
      ? revealOrMaskSecret(r.value_encrypted, reveal).display
      : r.value_encrypted,
  }));
}

export function upsertPlatformConfigDemo(input: {
  config_key: string;
  value: string;
  label?: string;
  config_group?: ConfigGroup;
  is_secret?: boolean;
}): PlatformConfigRow {
  const idx = rows.findIndex((r) => r.config_key === input.config_key);
  const isSecret = input.is_secret ?? rows[idx]?.is_secret ?? true;
  const stored =
    isSecret && input.value && !input.value.includes("•")
      ? encryptSecret(input.value)
      : input.value.includes("•")
        ? rows[idx]?.value_encrypted ?? ""
        : input.value;

  if (idx >= 0) {
    rows[idx] = {
      ...rows[idx]!,
      value_encrypted: stored,
      label: input.label ?? rows[idx]!.label,
      config_group: input.config_group ?? rows[idx]!.config_group,
      updated_at: new Date().toISOString(),
    };
    return { ...rows[idx]! };
  }

  const created: PlatformConfigRow = {
    id: `pc-${crypto.randomUUID()}`,
    config_key: input.config_key,
    config_group: input.config_group ?? "GLOBAL_KEYS",
    label: input.label ?? input.config_key,
    value_encrypted: stored,
    is_secret: isSecret,
    updated_at: new Date().toISOString(),
  };
  rows = [created, ...rows];
  return { ...created };
}

/** Master vault gate — PIN from env or demo default for local. */
export function vaultPinConfigured(): boolean {
  const pin = process.env.SUPER_ADMIN_VAULT_PIN;
  return Boolean(pin && pin.length >= 4);
}

export function vaultPinMatches(pin: string | null | undefined): boolean {
  const expected =
    process.env.SUPER_ADMIN_VAULT_PIN ||
    (process.env.NODE_ENV !== "production" ? "4829" : "");
  if (!expected || !pin) return false;
  return pin === expected;
}
