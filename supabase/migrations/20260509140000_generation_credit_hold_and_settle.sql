-- 生图扣费时机：提交任务时只增加 credit_hold（冻结额度）；轮询到成功拿到 URL 时才扣减 image_generation_count；
-- 失败或超时时仅释放 credit_hold，不扣「已入账」次数。
--
-- 注意：若线上仍有「旧逻辑」下创建的 polling 任务（当时已扣过 image_generation_count），升级后不要对同一批任务再结算，
-- 建议在低峰执行本迁移或先清空/处理完 polling 队列，避免重复扣费或 hold 不一致。

ALTER TABLE public.ai_image_credits
  ADD COLUMN IF NOT EXISTS credit_hold integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ai_image_credits.credit_hold IS '为进行中（polling）任务冻结的次数；成功时与扣减 image_generation_count 一并释放，失败时仅释放。';

ALTER TABLE public.ai_image_generation_jobs
  ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.ai_image_generation_jobs.credit_cost IS '创建任务时按分辨率确定的扣费点数（与 ai_image_start_generation_job 一致）。';

UPDATE public.ai_image_generation_jobs
SET credit_cost = CASE lower(trim(coalesce(request_payload->>'resolution', '1k')))
  WHEN '2k' THEN 2
  WHEN '4k' THEN 3
  ELSE 1
END
WHERE credit_cost IS NULL OR credit_cost < 1;

CREATE OR REPLACE FUNCTION public.ai_image_start_generation_job(
  p_user_id uuid,
  p_external_task_id text,
  p_request_payload jsonb,
  p_result_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
  v_bank integer;
  v_hold integer;
  v_available integer;
  v_status text;
  v_res text;
  v_cost integer;
  v_immediate_url text;
BEGIN
  IF p_external_task_id IS NULL OR length(trim(p_external_task_id)) = 0 THEN
    RAISE EXCEPTION 'invalid_external_task_id' USING ERRCODE = 'P0001';
  END IF;

  v_res := lower(trim(coalesce(p_request_payload->>'resolution', '1k')));
  v_cost := CASE v_res
    WHEN '1k' THEN 1
    WHEN '2k' THEN 2
    WHEN '4k' THEN 3
    ELSE NULL
  END;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'invalid_resolution' USING ERRCODE = 'P0001';
  END IF;

  SELECT image_generation_count, coalesce(credit_hold, 0)
  INTO v_bank, v_hold
  FROM public.ai_image_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  v_available := v_bank - v_hold;
  IF v_available < v_cost THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.ai_image_credits
  SET credit_hold = coalesce(credit_hold, 0) + v_cost
  WHERE user_id = p_user_id;

  v_immediate_url := nullif(trim(coalesce(p_result_url, '')), '');
  IF v_immediate_url IS NOT NULL THEN
    v_status := 'succeeded';
  ELSE
    v_status := 'polling';
  END IF;

  INSERT INTO public.ai_image_generation_jobs (
    user_id,
    external_task_id,
    request_payload,
    status,
    result_url,
    poll_count,
    credit_cost
  ) VALUES (
    p_user_id,
    trim(p_external_task_id),
    coalesce(p_request_payload, '{}'::jsonb),
    v_status,
    CASE WHEN v_status = 'succeeded' THEN v_immediate_url ELSE NULL END,
    0,
    v_cost
  )
  RETURNING id INTO v_job_id;

  -- Apimart 同步完成：当场扣减「已入账」次数并释放冻结
  IF v_status = 'succeeded' THEN
    UPDATE public.ai_image_credits
    SET
      image_generation_count = image_generation_count - v_cost,
      credit_hold = credit_hold - v_cost
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_image_settle_generation_job(
  p_job_id uuid,
  p_success boolean,
  p_result_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cost integer;
  v_payload jsonb;
  v_url text;
BEGIN
  SELECT user_id, credit_cost, request_payload
  INTO v_user_id, v_cost, v_payload
  FROM public.ai_image_generation_jobs
  WHERE id = p_job_id AND status = 'polling'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_cost IS NULL OR v_cost < 1 THEN
    v_cost := CASE lower(trim(coalesce(v_payload->>'resolution', '1k')))
      WHEN '2k' THEN 2
      WHEN '4k' THEN 3
      ELSE 1
    END;
  END IF;

  v_url := nullif(trim(coalesce(p_result_url, '')), '');

  IF p_success AND v_url IS NOT NULL THEN
    UPDATE public.ai_image_generation_jobs
    SET
      status = 'succeeded',
      result_url = v_url,
      updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.ai_image_credits
    SET
      image_generation_count = image_generation_count - v_cost,
      credit_hold = credit_hold - v_cost
    WHERE user_id = v_user_id;
  ELSE
    UPDATE public.ai_image_generation_jobs
    SET
      status = 'failed',
      updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.ai_image_credits
    SET credit_hold = credit_hold - v_cost
    WHERE user_id = v_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.ai_image_settle_generation_job(uuid, boolean, text) IS
  '轮询将任务从 polling 终结为 succeeded/failed 时结算：成功则扣 image_generation_count 并释放 hold；失败仅释放 hold。幂等：非 polling 则直接返回。';

REVOKE ALL ON FUNCTION public.ai_image_settle_generation_job(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_image_settle_generation_job(uuid, boolean, text) TO service_role;
