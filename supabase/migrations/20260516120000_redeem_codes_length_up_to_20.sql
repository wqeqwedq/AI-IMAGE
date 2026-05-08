-- 兑换码长度扩展到 12～20 位（管理端可生成 20 位）；校验字符集不变。

CREATE OR REPLACE FUNCTION public.redeem_ai_image_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_norm text;
    v_row public.ai_image_redeem_codes%ROWTYPE;
    v_attempts integer;
    v_rate_max constant integer := 10;
    v_window constant interval := interval '1 minute';
    v_updated integer;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;

    SELECT count(*)::integer INTO v_attempts
    FROM public.ai_image_redeem_attempts
    WHERE user_id = v_uid
      AND created_at > (now() - v_window);

    IF v_attempts >= v_rate_max THEN
        RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;

    INSERT INTO public.ai_image_redeem_attempts (user_id) VALUES (v_uid);

    v_norm := upper(regexp_replace(trim(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g'));

    IF length(v_norm) < 12 OR length(v_norm) > 20 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_format');
    END IF;

    IF translate(v_norm, 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', '') <> '' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_format');
    END IF;

    SELECT * INTO v_row
    FROM public.ai_image_redeem_codes
    WHERE code = v_norm
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
    END IF;

    IF v_row.status IS DISTINCT FROM 'unused' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'already_used');
    END IF;

    IF v_row.expire_at IS NOT NULL AND v_row.expire_at < now() THEN
        RETURN jsonb_build_object('ok', false, 'error', 'expired');
    END IF;

    UPDATE public.ai_image_redeem_codes
    SET status = 'used',
        used_by = v_uid,
        used_at = now()
    WHERE id = v_row.id
      AND status = 'unused';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated <> 1 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'concurrent_use');
    END IF;

    UPDATE public.ai_image_credits
    SET image_generation_count = coalesce(image_generation_count, 0) + v_row.points
    WHERE user_id = v_uid;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
        INSERT INTO public.ai_image_credits (
            user_id,
            image_generation_count,
            max_image_generation_count,
            model_training_count,
            max_model_training_count
        )
        VALUES (v_uid, v_row.points, 0, 0, 0);
    END IF;

    RETURN jsonb_build_object('ok', true, 'points', v_row.points);
END;
$$;

COMMENT ON COLUMN public.ai_image_redeem_codes.code IS '大写存储；字符集 ABCDEFGHJKMNPQRSTUVWXYZ23456789，长度 12～20。';

CREATE OR REPLACE FUNCTION public.random_redeem_code(p_len integer DEFAULT 14)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    n integer := greatest(12, least(coalesce(nullif(p_len, 0), 14), 20));
    i integer := 0;
    out text := '';
    pos integer;
BEGIN
    WHILE i < n LOOP
        pos := 1 + floor(random() * length(chars))::integer;
        out := out || substr(chars, pos, 1);
        i := i + 1;
    END LOOP;
    RETURN out;
END;
$$;

COMMENT ON FUNCTION public.random_redeem_code(integer) IS '生成 12～20 位卡密；Dashboard SQL 使用；勿授予终端用户。';
