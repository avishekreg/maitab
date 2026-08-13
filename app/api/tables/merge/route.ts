import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    parentTableId?: string;
    childTableIds?: string[];
  };

  if (!body.parentTableId || !body.childTableIds?.length) {
    return NextResponse.json(
      { ok: false, reason: "parentTableId and childTableIds are required" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      message: "Merge applied locally. Wire Supabase to persist MERGED_PARENT/CHILD.",
    });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("merge_tables", {
      p_parent: body.parentTableId,
      p_children: body.childTableIds,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, reason: error.message, mode: "live" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "live",
      message: "Tables merged with pre-booking buffer enforcement.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: err instanceof Error ? err.message : "Merge failed",
        mode: "live",
      },
      { status: 500 }
    );
  }
}
