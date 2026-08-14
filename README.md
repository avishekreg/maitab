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

Use `/login` to switch roles. Super Admin is not listed publicly — unlock via `/super-admin-vault` (Master Auth + 2FA PIN) or `/admin/super-portal` with `SUPER_ADMIN_PORTAL_KEY`.

## Key routes

| Route | Role |
| --- | --- |
| `/` | Marketing landing (public) |
| `/onboard` | B2B SaaS checkout & provision |
| `/home` `/tab` `/pass` `/game` | Customer |
| `/gate` | Gate staff |
| `/kds` | Bartender |
| `/av-panel` | AV controller |
| `/admin/club` | Club admin (venues, menu, zones, compliance) |
| `/admin/manager` | Floor Manager / Captain CRUD + rush override |
| `/super-admin-vault` | Hidden Super Admin config vault |
| `/admin/super-portal` | Legacy Super Admin unlock (env portal key) |
| `/admin/super` | Super admin console (after unlock) |
| `/t/[token]` | Cryptographically sealed table QR join |

## Enterprise hardening

- Migration: `supabase/migrations/09_enterprise_hardening.sql` (`platform_config`, license columns, staff/menu CRUD, SaaS onboarding).
- Compliance watchdog freezes guest ordering / check-in when liquor or FSSAI licenses expire (admin login remains).
- Vault env: `SUPER_ADMIN_VAULT_PIN` (local default `4829` when unset in development).

## Phase 4 — Production hardening

- `/t/[token]` → `POST /api/sessions/attach` upserts live floor sessions with merged-child routing.
- `/api/*` role guards in `middleware.ts` (`lib/auth/rbac.ts` `PROTECTED_API_ROUTES`).
- Member Pass: cryptographically sealed token + standards QR.
- AutoPay: Automated Direct-Settlement Gateway hooks + webhooks; `/tab` GPS exit settles the session.
- Super Admin secrets: AES-256-GCM via `CONFIG_ENCRYPTION_KEY`.
