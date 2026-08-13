import { encryptSecret, isEncryptedSecret, revealOrMaskSecret } from "@/lib/crypto/secrets";
import { DEMO_PROPERTY_VENUES } from "@/lib/demo/venues";

export interface AggregatorSettingsPublic {
  venue_id: string;
  zomato_api_key_masked: string;
  swiggy_api_key_masked: string;
  has_zomato_key: boolean;
  has_swiggy_key: boolean;
  aggregator_sync_active: boolean;
  external_table_lockout_enabled: boolean;
}

interface DemoAggregatorSecrets {
  zomato_api_key: string;
  swiggy_api_key: string;
  external_table_lockout_enabled: boolean;
}

const demoSecrets = new Map<string, DemoAggregatorSecrets>();

function ensureDemo(venueId: string): DemoAggregatorSecrets {
  if (!demoSecrets.has(venueId)) {
    demoSecrets.set(venueId, {
      zomato_api_key: "",
      swiggy_api_key: "",
      external_table_lockout_enabled: false,
    });
  }
  return demoSecrets.get(venueId)!;
}

export function getDemoAggregatorSettings(
  venueId: string
): AggregatorSettingsPublic {
  const row = ensureDemo(venueId);
  const zMask = revealOrMaskSecret(row.zomato_api_key, false).display;
  const sMask = revealOrMaskSecret(row.swiggy_api_key, false).display;
  const hasZ = Boolean(row.zomato_api_key);
  const hasS = Boolean(row.swiggy_api_key);
  return {
    venue_id: venueId,
    zomato_api_key_masked: zMask,
    swiggy_api_key_masked: sMask,
    has_zomato_key: hasZ,
    has_swiggy_key: hasS,
    aggregator_sync_active: hasZ || hasS,
    external_table_lockout_enabled: row.external_table_lockout_enabled,
  };
}

export function saveDemoAggregatorSettings(input: {
  venueId: string;
  zomatoApiKey?: string;
  swiggyApiKey?: string;
  clearZomato?: boolean;
  clearSwiggy?: boolean;
  externalTableLockoutEnabled: boolean;
}): AggregatorSettingsPublic {
  if (!DEMO_PROPERTY_VENUES.some((v) => v.id === input.venueId)) {
    throw new Error("Unknown venue");
  }

  const row = ensureDemo(input.venueId);

  if (input.clearZomato) {
    row.zomato_api_key = "";
  } else if (input.zomatoApiKey && !input.zomatoApiKey.includes("•")) {
    row.zomato_api_key = encryptSecret(input.zomatoApiKey.trim());
  }

  if (input.clearSwiggy) {
    row.swiggy_api_key = "";
  } else if (input.swiggyApiKey && !input.swiggyApiKey.includes("•")) {
    row.swiggy_api_key = encryptSecret(input.swiggyApiKey.trim());
  }

  row.external_table_lockout_enabled = input.externalTableLockoutEnabled;

  return getDemoAggregatorSettings(input.venueId);
}

export function shouldKeepExistingSecret(value: string | undefined): boolean {
  if (!value) return true;
  if (value.includes("•")) return true;
  if (isEncryptedSecret(value)) return true;
  return false;
}
