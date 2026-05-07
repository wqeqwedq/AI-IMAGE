-- Enables scheduling Edge Functions via pg_cron + pg_net (see Supabase docs:
-- https://supabase.com/docs/guides/functions/schedule-functions )
-- Cron job + vault secrets for poll-apimart-jobs are configured in Dashboard / SQL, not in this file.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
