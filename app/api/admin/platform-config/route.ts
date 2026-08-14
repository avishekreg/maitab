import { NextResponse, type NextRequest } from "next/server";
import {
  listPlatformConfigDemo,
  publicPlatformConfig,
  upsertPlatformConfigDemo,
  vaultPinMatches,
  type ConfigGroup,
} from "@/lib/admin/platform-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret, revealOrMaskSecret } from "@/lib/crypto/secrets";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function pinFrom(request: NextRequest, body?: { vaultPin?: string }) {
  return (
    body?.vaultPin ||
    request.headers.get("x-maitab-vault-pin") ||
    request.nextUrl.searchParams.get("pin")
  );
}

export async function GET(request: NextRequest) {
  const pin = pinFrom(request);
  if (!vaultPinMatches(pin)) {
    return NextResponse.json(
      { ok: false, reason: "Invalid vault PIN" },
      { status: 401 }
    );
  }

  const reveal = request.nextUrl.searchParams.get("reveal") === "1";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      configs: publicPlatformConfig(reveal),
    });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("platform_config")
      .select("*")
      .order("config_group");
    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message, configs: publicPlatformConfig(reveal) },
        { status: 200 }
      );
    }
    const configs = (data ?? listPlatformConfigDemo()).map((r) => ({
      ...r,
      value_encrypted: r.is_secret
        ? revealOrMaskSecret(String(r.value_encrypted ?? ""), reveal).display
        : String(r.value_encrypted ?? ""),
    }));
    return NextResponse.json({ ok: true, mode: "live", configs });
  } catch (err) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      configs: publicPlatformConfig(reveal),
      warning: err instanceof Error ? err.message : "fallback",
    });
  }
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as {
    vaultPin?: string;
    config_key?: string;
    value?: string;
    label?: string;
    config_group?: ConfigGroup;
    is_secret?: boolean;
  };

  if (!vaultPinMatches(pinFrom(request, body))) {
    return NextResponse.json(
      { ok: false, reason: "Invalid vault PIN" },
      { status: 401 }
    );
  }

  if (!body.config_key || body.value === undefined) {
    return NextResponse.json(
      { ok: false, reason: "config_key and value required" },
      { status: 400 }
    );
  }

  const looksMasked = body.value.includes("•");

  if (!isSupabaseConfigured()) {
    const row = upsertPlatformConfigDemo({
      config_key: body.config_key,
      value: body.value,
      label: body.label,
      config_group: body.config_group,
      is_secret: body.is_secret,
    });
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      config: {
        ...row,
        value_encrypted: row.is_secret
          ? revealOrMaskSecret(row.value_encrypted, false).display
          : row.value_encrypted,
      },
    });
  }

  try {
    const supabase = createAdminClient();
    let stored = body.value;
    const isSecret = body.is_secret ?? true;

    if (isSecret && looksMasked) {
      const { data: existing } = await supabase
        .from("platform_config")
        .select("value_encrypted")
        .eq("config_key", body.config_key)
        .maybeSingle();
      stored = existing?.value_encrypted ?? "";
    } else if (isSecret && body.value) {
      stored = encryptSecret(body.value);
    }

    const { data, error } = await supabase
      .from("platform_config")
      .upsert(
        {
          config_key: body.config_key,
          label: body.label ?? body.config_key,
          config_group: body.config_group ?? "GLOBAL_KEYS",
          value_encrypted: stored,
          is_secret: isSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "config_key" }
      )
      .select("*")
      .single();

    if (error) {
      const row = upsertPlatformConfigDemo({
        config_key: body.config_key,
        value: body.value,
        label: body.label,
        config_group: body.config_group,
        is_secret: body.is_secret,
      });
      return NextResponse.json({
        ok: true,
        mode: "fallback",
        config: row,
        warning: error.message,
      });
    }

    return NextResponse.json({ ok: true, mode: "live", config: data });
  } catch (err) {
    const row = upsertPlatformConfigDemo({
      config_key: body.config_key,
      value: body.value,
      label: body.label,
      config_group: body.config_group,
      is_secret: body.is_secret,
    });
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      config: row,
      warning: err instanceof Error ? err.message : "fallback",
    });
  }
}
