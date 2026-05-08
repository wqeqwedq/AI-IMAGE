-- 示例：在 SQL Editor 中维护「购买兑换码」按钮（label + url）
INSERT INTO public.ai_image_redeem_purchase_links (label, url, sort_order, is_active)
VALUES
    ('闲鱼', 'https://example.com/xianyu', 10, true),
    ('淘宝', 'https://example.com/taobao', 20, true);

-- 下线某条
-- UPDATE public.ai_image_redeem_purchase_links SET is_active = false WHERE label = '淘宝';
