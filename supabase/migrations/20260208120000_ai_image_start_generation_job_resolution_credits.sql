-- Deduct 1 / 2 / 3 credits for resolution 1k / 2k / 4k (from request_payload), not always 1.

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
  v_credits integer;
  v_status text;
  v_res text;
  v_cost integer;
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

  SELECT image_generation_count INTO v_credits
  FROM public.ai_image_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL OR v_credits < v_cost THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.ai_image_credits
  SET image_generation_count = image_generation_count - v_cost
  WHERE user_id = p_user_id;

  IF p_result_url IS NOT NULL AND length(trim(p_result_url)) > 0 THEN
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
    poll_count
  ) VALUES (
    p_user_id,
    trim(p_external_task_id),
    coalesce(p_request_payload, '{}'::jsonb),
    v_status,
    CASE WHEN v_status = 'succeeded' THEN trim(p_result_url) ELSE NULL END,
    0
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;
