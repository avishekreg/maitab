import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SYSTEM_CONFIGS,
  type SystemConfigItem,
} from "@/lib/admin/system-config";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  revealOrMaskSecret,
} from "@/lib/crypto/secrets";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function presentConfigs(
  configs: SystemConfigItem[],
  reveal: boolean
): SystemConfigItem[] {
  return configs.map((item) => {
    if (!item.is_secret) return item;
    const { display } = revealOrMaskSecret(item.value_encrypted, reveal);
    return {
      ...item,
      value_encrypted: display,
      value_json: {
        ...item.value_json,
        _encrypted: isEncryptedSecret(item.value_encrypted) || Boolean(item.value_encrypted),
      },
    };
  });
}

export async function GET(request: NextRequest) {
  const reveal = request.nextUrl.searchParams.get("reveal") === "1";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      configs: presentConfigs(DEFAULT_SYSTEM_CONFIGS, reveal),
    });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("system_configs")
      .select("*")
      .order("category");

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "live",
      configs: presentConfigs(
        (data as SystemConfigItem[]) ?? DEFAULT_SYSTEM_CONFIGS,
        reveal
      ),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Config fetch failed",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    config_key?: string;
    value_encrypted?: string;
    value_json?: Record<string, unknown>;
  };

  if (!body.config_key) {
    return NextResponse.json(
      { ok: false, reason: "config_key required" },
      { status: 400 }
    );
  }

  const isSecretKey =
    DEFAULT_SYSTEM_CONFIGS.find((c) => c.config_key === body.config_key)
      ?.is_secret ?? Boolean(body.value_encrypted);

  // Ignore masked placeholders from the UI (••••abcd).
  const rawSecret = body.value_encrypted ?? "";
  const looksMasked = /^•+\S{0,4}$/.test(rawSecret) || rawSecret.includes("•");

  let storedSecret = "";
  if (isSecretKey && rawSecret && !looksMasked) {
    storedSecret = encryptSecret(rawSecret);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      config_key: body.config_key,
      value_encrypted: isSecretKey
        ? revealOrMaskSecret(storedSecret || rawSecret, false).display
        : "",
      value_json: body.value_json ?? {},
      updated_at: new Date().toISOString(),
      encrypted: Boolean(storedSecret),
    });
  }

  try {
    const supabase = createAdminClient();

    // Preserve existing ciphertext when UI submits a masked value.
    let nextEncrypted = storedSecret;
    if (isSecretKey && looksMasked) {
      const { data: existing } = await supabase
        .from("system_configs")
        .select("value_encrypted")
        .eq("config_key", body.config_key)
        .maybeSingle();
      nextEncrypted = existing?.value_encrypted ?? "";
    }

    const { data, error } = await supabase
      .from("system_configs")
      .update({
        value_encrypted: isSecretKey ? nextEncrypted : "",
        value_json: body.value_json ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("config_key", body.config_key)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message },
        { status: 400 }
      );
    }

    const presented = presentConfigs([data as SystemConfigItem], false)[0];

    return NextResponse.json({
      ok: true,
      mode: "live",
      config: presented,
      encrypted: isSecretKey ? isEncryptedSecret(nextEncrypted) : false,
      // Server-only sanity: decrypt round-trip works
      decrypt_ok: isSecretKey
        ? Boolean(nextEncrypted && decryptSecret(nextEncrypted))
        : true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Config update failed",
      },
      { status: 500 }
    );
  }
}
