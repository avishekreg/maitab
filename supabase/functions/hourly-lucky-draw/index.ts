// Supabase Edge Function — schedule every 60 minutes
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id")
    .eq("lucky_draw_enabled", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const winners: Array<{ clubId: string; sessionId: string | null }> = [];

  for (const club of clubs ?? []) {
    const { data, error: rpcError } = await supabase.rpc(
      "run_hourly_lucky_draw",
      { p_club_id: club.id }
    );

    if (rpcError) {
      winners.push({ clubId: club.id, sessionId: null });
      continue;
    }

    winners.push({ clubId: club.id, sessionId: data as string | null });
  }

  return new Response(JSON.stringify({ ok: true, winners }), {
    headers: { "Content-Type": "application/json" },
  });
});
