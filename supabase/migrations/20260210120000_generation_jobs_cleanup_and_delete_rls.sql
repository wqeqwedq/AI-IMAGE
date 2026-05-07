-- 删除超过 60 小时的「已成功」异步生图任务；允许用户删除自己的任务行（画廊）

DROP POLICY IF EXISTS ai_image_generation_jobs_delete_own ON public.ai_image_generation_jobs;

CREATE POLICY ai_image_generation_jobs_delete_own
  ON public.ai_image_generation_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ai_image_cleanup_old_succeeded_jobs()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.ai_image_generation_jobs
    WHERE status = 'succeeded'
      AND created_at < (now() - interval '60 hours')
    RETURNING id
  )
  SELECT count(*)::int FROM deleted;
$$;

REVOKE ALL ON FUNCTION public.ai_image_cleanup_old_succeeded_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_image_cleanup_old_succeeded_jobs() TO service_role;

-- 若已启用 pg_cron：每小时整点清理（可按需在 Dashboard 调整）
DO $outer$
DECLARE
  jid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR jid IN
      SELECT jobid FROM cron.job WHERE jobname = 'cleanup_ai_image_generation_jobs'
    LOOP
      PERFORM cron.unschedule(jid);
    END LOOP;

    PERFORM cron.schedule(
      'cleanup_ai_image_generation_jobs',
      '0 * * * *',
      'SELECT public.ai_image_cleanup_old_succeeded_jobs();'
    );
  END IF;
END;
$outer$;
