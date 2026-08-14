-- Optional follow-up if 09 already applied with old commission defaults
update public.platform_config
set value_encrypted = '10', updated_at = now()
where config_key = 'COMMISSION_STARTER_PCT';

update public.platform_config
set value_encrypted = '8', updated_at = now()
where config_key = 'COMMISSION_PRO_PCT';
