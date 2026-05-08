-- =============================================================================
-- 批量生成「永不过期」随机兑换码（依赖 public.random_redeem_code）
-- 在 Supabase → SQL Editor 以 postgres 执行。
--
-- 只改 VALUES：每一行 (额度 points, 生成个数 cnt, 码长 code_len)。
--   code_len 取 12～16；写 NULL 则按 14 位生成。
-- =============================================================================

INSERT INTO public.ai_image_redeem_codes (code, points, status, expire_at)
SELECT
    public.random_redeem_code(COALESCE(t.code_len, 14)),
    t.points,
    'unused',
    NULL
FROM (
    VALUES
        -- 示例：按需改数字或增删行
        (50::integer,  20::integer, 14::integer),  -- 50 点 × 20 条，14 位
        (100::integer, 10::integer, NULL::integer), -- 100 点 × 10 条，默认 14 位
        (200::integer,  5::integer, 16::integer)   -- 200 点 × 5 条，16 位
) AS t(points, cnt, code_len)
CROSS JOIN LATERAL generate_series(1, t.cnt) AS g(i);

-- 若报错 duplicate key on code：随机极小概率重复，可删未用新码后重跑少批量：
-- DELETE FROM public.ai_image_redeem_codes
-- WHERE status = 'unused' AND used_at IS NULL AND created_at > now() - interval '10 minutes';

-- 核对最近插入的未使用码：
-- SELECT code, points, status, created_at FROM public.ai_image_redeem_codes
-- WHERE expire_at IS NULL AND status = 'unused' ORDER BY created_at DESC LIMIT 200;
