-- 在 Supabase SQL Editor（postgres）中批量发卡密示例
-- 字符集与校验一致：ABCDEFGHJKMNPQRSTUVWXYZ23456789（无 0、O、1、I、L），长度 12～16。

-- 1) 生成一条随机码（默认 14 位）并插入：100 点生图剩余，永不过期
INSERT INTO public.ai_image_redeem_codes (code, points, status, expire_at)
VALUES (public.random_redeem_code(14), 100, 'unused', NULL);

-- 2) 指定明文码（须自行保证格式合法且唯一）
INSERT INTO public.ai_image_redeem_codes (code, points, status, expire_at)
VALUES ('ABCDEFGHJKMNPQ', 50, 'unused', NULL);

-- 3) 带过期时间
INSERT INTO public.ai_image_redeem_codes (code, points, status, expire_at)
VALUES ('ABCDEFGHJKMNPQ', 30, 'unused', now() + interval '30 days');
