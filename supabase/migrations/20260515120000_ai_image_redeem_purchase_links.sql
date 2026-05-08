-- 计费页「购买兑换码」外链：按钮文案 label + 跳转 url，后台改表即可，无需发版。

CREATE TABLE public.ai_image_redeem_purchase_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label text NOT NULL,
    url text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ai_image_redeem_purchase_links_url_check CHECK (
        url ~* '^https?://'
    )
);

COMMENT ON TABLE public.ai_image_redeem_purchase_links IS '兑换码购买渠道：label 为按钮名，url 为完整 https 链接；仅 is_active 时对登录用户可读。';

CREATE INDEX ai_image_redeem_purchase_links_active_sort_idx
    ON public.ai_image_redeem_purchase_links (is_active, sort_order, id);

ALTER TABLE public.ai_image_redeem_purchase_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_image_redeem_purchase_links_select_authenticated"
    ON public.ai_image_redeem_purchase_links
    FOR SELECT
    TO authenticated
    USING (is_active = true);
