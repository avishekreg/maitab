import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
  };

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const readyAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      orderId: body.orderId,
      status: "READY",
      ready_at: readyAt,
      mode: "fallback",
      hapticPattern: [80, 40, 80, 40, 120],
    });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "READY", ready_at: readyAt })
      .eq("id", body.orderId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: data,
      status: "READY",
      mode: "live",
      hapticPattern: [80, 40, 80, 40, 120],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Update failed",
      },
      { status: 500 }
    );
  }
}
