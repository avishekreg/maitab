export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  if (url.includes("your-project") || anon.includes("your-anon")) return false;
  return true;
}

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    configured: isSupabaseConfigured(),
  };
}

export const NEON_CLUB_ID = "22222222-2222-2222-2222-222222222222";
export const COMPETITOR_CLUB_ID = "22222222-2222-2222-2222-222222222223";
export const DEMO_SESSION_ID = "33333333-3333-3333-3333-333333333333";
export const DEMO_CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
export const TABLE_B4_ID = "b0000000-0000-0000-0000-000000000004";
