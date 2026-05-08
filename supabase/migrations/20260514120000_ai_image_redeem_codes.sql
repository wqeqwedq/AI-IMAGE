-- 卡密 / 兑换码：仅通过 RPC redeem_ai_image_code 兑换；加 ai_image_credits.image_generation_count（剩余），不加上限。
-- 12～16 位、字符集 A-Z0-9 去掉 0、O、1、I、L；限流：同一用户 1 分钟内最多尝试 10 次（含错误码）。

CREATE TABLE public.ai_image_redeem_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    points integer NOT NULL CHECK (points > 0),
    status text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
    used_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    used_at timestamptz,
    expire_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ai_image_redeem_codes_code_key UNIQUE (code)
);

CREATE INDEX ai_image_redeem_codes_status_idx ON public.ai_image_redeem_codes (status)
    WHERE status = 'unused';

COMMENT ON TABLE public.ai_image_redeem_codes IS '充值卡密：status unused/used；expire_at NULL 永不过期；仅 SECURITY DEFINER RPC 写入 used_*。';
COMMENT ON COLUMN public.ai_image_redeem_codes.code IS '大写存储；字符集 ABCDEFGHJKMNPQRSTUVWXYZ23456789，长度 12～16。';
COMMENT ON COLUMN public.ai_image_redeem_codes.points IS '兑换成功后增加的生图剩余次数。';

CREATE TABLE public.ai_image_redeem_attempts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_image_redeem_attempts_user_time_idx
    ON public.ai_image_redeem_attempts (user_id, created_at DESC);

COMMENT ON TABLE public.ai_image_redeem_attempts IS '兑换请求计数，用于每用户短时间限流。';

ALTER TABLE public.ai_image_redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_image_redeem_attempts ENABLE ROW LEVEL SECURITY;

-- 无 policy：authenticated 不能直接读写，仅能通过 RPC（SECURITY DEFINER）访问。

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

    IF length(v_norm) < 12 OR length(v_norm) > 16 THEN
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

COMMENT ON FUNCTION public.redeem_ai_image_code(text) IS '登录用户兑换卡密：校验格式与限流、占用卡密、增加生图剩余次数。';

REVOKE ALL ON FUNCTION public.redeem_ai_image_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_ai_image_code(text) TO authenticated;

-- 可选：在 SQL Editor 中生成随机卡密（勿对 authenticated 开放 EXECUTE）
CREATE OR REPLACE FUNCTION public.random_redeem_code(p_len integer DEFAULT 14)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    n integer := greatest(12, least(coalesce(nullif(p_len, 0), 14), 16));
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

COMMENT ON FUNCTION public.random_redeem_code(integer) IS '生成 12～16 位卡密字符串；请在 Dashboard 以 postgres 执行，勿授予终端用户。';

REVOKE ALL ON FUNCTION public.random_redeem_code(integer) FROM PUBLIC;
