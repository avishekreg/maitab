# mAITab

Zero-hardware, POS-independent nightlife SaaS + customer web app for prepaid bar tabs, gate hospitality, bartender KDS, AV wall takeovers, table merging, social games, and geo-fenced AutoPay settlement.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Framer Motion + Lucide React
- Zustand + TanStack Query
- Supabase (Postgres, RLS, Realtime, Edge Functions, PostGIS)

## Quick start

```bash
cp .env.example .env.local
# set TABLE_QR_HMAC_SECRET (required for /t/[token])
# optionally set real NEXT_PUBLIC_SUPABASE_* + SERVICE_ROLE for live mode
npm install
npm run dev -- -p 3100 -H 127.0.0.1
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100).

Use `/login` to switch roles. With Supabase seeded, login issues JWT claims (`app_metadata.role`) for RLS; otherwise a demo cookie is used.

## Phase 2 — Live Supabase

```bash
# In Supabase SQL editor (or CLI):
# 1) supabase/migrations/01_schema.sql
# 2) supabase/migrations/02_phase2.sql
# 3) supabase/migrations/03_system_configs.sql
# 4) supabase/seed.sql
```

Public demo users (password: `MaiTabDemo!234`):

| Role | Email | Opens |
| --- | --- | --- |
| CLUB_ADMIN | `club@maitab.demo` | `/admin/club` |
| GATE_STAFF | `gate@maitab.demo` | `/gate` |
| BARTENDER | `bar@maitab.demo` | `/kds` |
| AV_CONTROLLER | `av@maitab.demo` | `/av-panel` |
| CUSTOMER | `rahul@maitab.demo` | `/home` |

Use [http://127.0.0.1:3100/login](http://127.0.0.1:3100/login) for one-click venue demo entry. Super Admin is not listed publicly — unlock via `/admin/super-portal` with `SUPER_ADMIN_PORTAL_KEY`.

Without Supabase credentials the app stays in **fallback mode**: BroadcastChannel realtime for Gate→AV and KDS→Tab, plus RPC API stubs that mirror PostGIS lockout behaviour.

## Key routes

| Route | Role |
| --- | --- |
| `/` | Marketing landing (public) |
| `/home` `/tab` `/pass` `/game` | Customer |
| `/gate` | Gate staff |
| `/kds` | Bartender |
| `/av-panel` | AV controller |
| `/admin/club` | Club admin |
| `/admin/super-portal` | Super admin unlock (env portal key) |
| `/admin/super` | Super admin console (after unlock) |
| `/t/[token]` | HMAC table QR join |

## Supabase

1. Create a project and enable the `postgis` extension.
2. Run `supabase/migrations/01_schema.sql`.
3. Deploy edge functions in `supabase/functions/`.
4. Schedule `hourly-lucky-draw` every 60 minutes.

## Branding

- Logo: `components/branding/mAITab-logo.tsx`
- Tokens: `tailwind.config.ts` (`nightlife-bg`, violet `#7C3AED`, gold, emerald, ruby)
- Favicon data URI helper: `lib/branding/favicon.ts` (mAI-accented mark)

## Phase 5 — 100+ Surprise Games

- Catalog: `lib/games/100_games_catalog.ts` (105 games across 6 mechanics)
- Local fallback: `lib/games/data.ts` · seed: `supabase/seed_games.sql` (merged into `seed.sql`)
- Dispenser: `useSurpriseGame` + weighted no-repeat (`session_played_games`, 2h window)
- Migration: `supabase/migrations/04_games_engine.sql`

## Phase 4 — Production hardening

- `/t/[token]` → `POST /api/sessions/attach` upserts `active_sessions` with `resolve_primary_table` for merged children.
- `/api/*` role guards in `middleware.ts` (`lib/auth/rbac.ts` `PROTECTED_API_ROUTES`).
- Member Pass: HMAC token + standards QR (`components/pass/MemberPassQR.tsx`, `/api/pass/token`).
- AutoPay: Razorpay/Cashfree provider hooks + webhooks; `/tab` GPS exit calls `/api/payments/settle` → `geo-auto-settle` Edge Function.
- Super Admin secrets: AES-256-GCM via `CONFIG_ENCRYPTION_KEY` (`lib/crypto/secrets.ts`).

## Notes

- Local demo state lives in Zustand (`lib/store/session-store.ts`) so UI flows work before Supabase credentials are wired.
- Cryptographic table QR signing requires `TABLE_QR_HMAC_SECRET`.
- Without live Supabase credentials, Gate → AV / KDS → Tab use `BroadcastChannel` fallback (`lib/realtime/bus.ts`); with credentials, Supabase Realtime is preferred.
