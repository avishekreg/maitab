-- Phase 3: No-code Super Admin system configuration vault

create table if not exists public.system_configs (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  category text not null check (category in (
    'PAYMENTS',
    'MESSAGING',
    'MAPS',
    'AI',
    'FEATURE_FLAGS',
    'GEO'
  )),
  label text not null,
  value_encrypted text not null default '',
  value_json jsonb not null default '{}'::jsonb,
  is_secret boolean not null default true,
  updated_by uuid references public.users (id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.system_configs enable row level security;

create policy system_configs_super_select on public.system_configs
for select using (public.current_user_role() = 'SUPER_ADMIN');

create policy system_configs_super_write on public.system_configs
for all using (public.current_user_role() = 'SUPER_ADMIN')
with check (public.current_user_role() = 'SUPER_ADMIN');

create or replace function public.touch_system_config()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_system_configs_touch on public.system_configs;
create trigger trg_system_configs_touch
before update on public.system_configs
for each row execute function public.touch_system_config();

-- Seed default keys (empty secrets; flags/geo defaults usable immediately)
insert into public.system_configs (config_key, category, label, value_encrypted, value_json, is_secret)
values
  ('payments.razorpay.key_id', 'PAYMENTS', 'Razorpay Key ID', '', '{}'::jsonb, true),
  ('payments.razorpay.key_secret', 'PAYMENTS', 'Razorpay Key Secret', '', '{}'::jsonb, true),
  ('payments.cashfree.app_id', 'PAYMENTS', 'Cashfree App ID', '', '{}'::jsonb, true),
  ('payments.cashfree.secret', 'PAYMENTS', 'Cashfree Secret', '', '{}'::jsonb, true),
  ('payments.merchant_id', 'PAYMENTS', 'Merchant ID', '', '{}'::jsonb, true),
  ('payments.preauth_limit', 'PAYMENTS', 'Pre-Auth Limit (INR)', '', '{"amount":10}'::jsonb, false),
  ('messaging.twilio.account_sid', 'MESSAGING', 'Twilio Account SID', '', '{}'::jsonb, true),
  ('messaging.twilio.auth_token', 'MESSAGING', 'Twilio Auth Token', '', '{}'::jsonb, true),
  ('messaging.gupshup.api_key', 'MESSAGING', 'Gupshup API Key', '', '{}'::jsonb, true),
  ('messaging.whatsapp.cloud_token', 'MESSAGING', 'WhatsApp Cloud Token', '', '{}'::jsonb, true),
  ('maps.google.api_key', 'MAPS', 'Google Maps API Key', '', '{}'::jsonb, true),
  ('maps.mapbox.token', 'MAPS', 'Mapbox Token', '', '{}'::jsonb, true),
  ('ai.openai.api_key', 'AI', 'OpenAI API Key', '', '{}'::jsonb, true),
  ('ai.vapi.token', 'AI', 'Vapi Token', '', '{}'::jsonb, true),
  ('ai.custom.webhook', 'AI', 'Custom Voice Webhook', '', '{"url":""}'::jsonb, false),
  ('geo.lockout_radius_m', 'GEO', 'PostGIS Lockout Radius (m)', '', '{"radius_m":1500}'::jsonb, false),
  ('flags.lucky_draw_global', 'FEATURE_FLAGS', 'Lucky Draw Engine', '', '{"enabled":true}'::jsonb, false),
  ('flags.av_takeover', 'FEATURE_FLAGS', 'AV Screen Takeover', '', '{"enabled":true}'::jsonb, false),
  ('flags.micro_hold_enforcement', 'FEATURE_FLAGS', 'Micro-Hold Pre-Auth', '', '{"enabled":true}'::jsonb, false)
on conflict (config_key) do nothing;
