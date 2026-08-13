import { NextResponse } from "next/server";
import { venueById } from "@/lib/demo/venues";
import {
  createFlashCampaignDemo,
  listActiveCampaigns,
  getCreditBalance,
  type FlashAudience,
} from "@/lib/flash/campaigns";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json(
      { ok: false, reason: "venueId required" },
      { status: 400 }
    );
  }

  const venue = venueById(venueId);
  if (!venue) {
    return NextResponse.json(
      { ok: false, reason: "Unknown venue" },
      { status: 404 }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const [{ data: campaigns }, { data: club }] = await Promise.all([
        admin
          .from("flash_campaigns")
          .select("*")
          .eq("venue_id", venueId)
          .order("created_at", { ascending: false })
          .limit(20),
        admin
          .from("clubs")
          .select("credit_balance")
          .eq("id", venueId)
          .maybeSingle(),
      ]);
      return NextResponse.json({
        ok: true,
        mode: "live",
        campaigns: campaigns ?? [],
        credit_balance:
          Number(club?.credit_balance ?? getCreditBalance(venue)),
      });
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "demo",
    campaigns: listActiveCampaigns(venueId),
    credit_balance: getCreditBalance(venue),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    venueId?: string;
    title?: string;
    category?: string;
    audience?: FlashAudience;
    durationMinutes?: number;
  };

  if (!body.venueId || !body.title || !body.category || !body.audience) {
    return NextResponse.json(
      {
        ok: false,
        reason: "venueId, title, category, audience required",
      },
      { status: 400 }
    );
  }

  const venue = venueById(body.venueId);
  if (!venue) {
    return NextResponse.json(
      { ok: false, reason: "Unknown venue" },
      { status: 404 }
    );
  }

  const duration = body.durationMinutes ?? 60;

  // Anti-cannibalization gate for category flash (existing RPC)
  if (isSupabaseConfigured() && body.category.toUpperCase() !== "ALL") {
    try {
      const admin = createAdminClient();
      const { data: allowed } = await admin.rpc("can_create_flash_promo", {
        p_club_id: body.venueId,
        p_category: body.category.toUpperCase(),
        p_radius_m: 1500,
        p_lockout_min: 60,
      });
      if (allowed === false) {
        return NextResponse.json(
          {
            ok: false,
            reason:
              "Blocked by PostGIS competitor lockout for this category.",
          },
          { status: 409 }
        );
      }
    } catch {
      /* continue with demo path */
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const cost = body.audience === "GEO_GLOBAL" ? 250 : 0;
      let balance = venue.credit_balance;

      if (cost > 0) {
        const { data: spent, error: spendErr } = await admin.rpc(
          "spend_promo_credits",
          {
            p_venue_id: body.venueId,
            p_amount: cost,
            p_reason: `Geo flash: ${body.title}`,
          }
        );
        if (spendErr) {
          return NextResponse.json(
            { ok: false, reason: spendErr.message },
            { status: 402 }
          );
        }
        balance = Number(spent);
      }

      const starts = new Date();
      const ends = new Date(starts.getTime() + duration * 60_000);
      const { data: campaign, error } = await admin
        .from("flash_campaigns")
        .insert({
          venue_id: body.venueId,
          title: body.title,
          category: body.category.toUpperCase(),
          audience: body.audience,
          duration_minutes: duration,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          credit_cost: cost,
          status: "ACTIVE",
        })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, reason: error.message },
          { status: 500 }
        );
      }

      if (body.category.toUpperCase() !== "ALL") {
        await admin
          .from("clubs")
          .update({ active_promo_category: body.category.toUpperCase() })
          .eq("id", body.venueId);
      }

      return NextResponse.json({
        ok: true,
        mode: "live",
        campaign,
        credit_balance: balance,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          reason: err instanceof Error ? err.message : "Campaign failed",
        },
        { status: 500 }
      );
    }
  }

  const result = createFlashCampaignDemo({
    venue,
    title: body.title,
    category: body.category,
    audience: body.audience,
    duration_minutes: duration,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 402 });
  }

  return NextResponse.json({
    ok: true,
    mode: "demo",
    campaign: result.campaign,
    credit_balance: result.credit_balance,
  });
}
