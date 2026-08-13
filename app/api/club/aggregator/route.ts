import { NextResponse } from "next/server";
import {
  getDemoAggregatorSettings,
  saveDemoAggregatorSettings,
  shouldKeepExistingSecret,
} from "@/lib/aggregators/settings";
import { encryptSecret, revealOrMaskSecret } from "@/lib/crypto/secrets";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function publicFromRow(venueId: string, row: {
  zomato_api_key?: string | null;
  swiggy_api_key?: string | null;
  aggregator_sync_active?: boolean | null;
  external_table_lockout_enabled?: boolean | null;
}) {
  const z = row.zomato_api_key ?? "";
  const s = row.swiggy_api_key ?? "";
  return {
    venue_id: venueId,
    zomato_api_key_masked: revealOrMaskSecret(z, false).display,
    swiggy_api_key_masked: revealOrMaskSecret(s, false).display,
    has_zomato_key: Boolean(z),
    has_swiggy_key: Boolean(s),
    aggregator_sync_active: Boolean(
      row.aggregator_sync_active ?? (z || s)
    ),
    external_table_lockout_enabled: Boolean(
      row.external_table_lockout_enabled
    ),
  };
}

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json(
      { ok: false, reason: "venueId required" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      settings: getDemoAggregatorSettings(venueId),
    });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clubs")
      .select(
        "zomato_api_key, swiggy_api_key, aggregator_sync_active, external_table_lockout_enabled"
      )
      .eq("id", venueId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, reason: "Venue not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "live",
      settings: publicFromRow(venueId, data),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Load failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    venueId?: string;
    zomatoApiKey?: string;
    swiggyApiKey?: string;
    clearZomato?: boolean;
    clearSwiggy?: boolean;
    externalTableLockoutEnabled?: boolean;
  };

  if (!body.venueId) {
    return NextResponse.json(
      { ok: false, reason: "venueId required" },
      { status: 400 }
    );
  }

  const lockout = Boolean(body.externalTableLockoutEnabled);

  if (!isSupabaseConfigured()) {
    try {
      const settings = saveDemoAggregatorSettings({
        venueId: body.venueId,
        zomatoApiKey: body.zomatoApiKey,
        swiggyApiKey: body.swiggyApiKey,
        clearZomato: body.clearZomato,
        clearSwiggy: body.clearSwiggy,
        externalTableLockoutEnabled: lockout,
      });
      return NextResponse.json({
        ok: true,
        mode: "demo",
        settings,
        sync_workers:
          settings.aggregator_sync_active &&
          settings.external_table_lockout_enabled
            ? "enabled"
            : "disabled",
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          reason: err instanceof Error ? err.message : "Save failed",
        },
        { status: 400 }
      );
    }
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: loadErr } = await admin
      .from("clubs")
      .select(
        "zomato_api_key, swiggy_api_key, external_table_lockout_enabled"
      )
      .eq("id", body.venueId)
      .maybeSingle();

    if (loadErr) {
      return NextResponse.json(
        { ok: false, reason: loadErr.message },
        { status: 500 }
      );
    }
    if (!existing) {
      return NextResponse.json(
        { ok: false, reason: "Venue not found" },
        { status: 404 }
      );
    }

    let zomato = existing.zomato_api_key ?? "";
    let swiggy = existing.swiggy_api_key ?? "";

    if (body.clearZomato) {
      zomato = "";
    } else if (
      body.zomatoApiKey &&
      !shouldKeepExistingSecret(body.zomatoApiKey)
    ) {
      zomato = encryptSecret(body.zomatoApiKey.trim());
    }

    if (body.clearSwiggy) {
      swiggy = "";
    } else if (
      body.swiggyApiKey &&
      !shouldKeepExistingSecret(body.swiggyApiKey)
    ) {
      swiggy = encryptSecret(body.swiggyApiKey.trim());
    }

    const aggregator_sync_active = Boolean(zomato || swiggy);

    const { data, error } = await admin
      .from("clubs")
      .update({
        zomato_api_key: zomato || null,
        swiggy_api_key: swiggy || null,
        aggregator_sync_active,
        external_table_lockout_enabled: lockout && aggregator_sync_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.venueId)
      .select(
        "zomato_api_key, swiggy_api_key, aggregator_sync_active, external_table_lockout_enabled"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message },
        { status: 500 }
      );
    }

    const settings = publicFromRow(body.venueId, data);
    return NextResponse.json({
      ok: true,
      mode: "live",
      settings,
      sync_workers:
        settings.aggregator_sync_active &&
        settings.external_table_lockout_enabled
          ? "enabled"
          : "disabled",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Save failed",
      },
      { status: 500 }
    );
  }
}
