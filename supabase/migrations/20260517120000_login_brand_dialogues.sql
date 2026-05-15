-- 登录页左侧品牌区（≥lg）：对话「套」+「行」；运营在 Supabase 控制台用 service role 维护。
-- 应用层约定：同一自然日从 enabled=true 的套中按日哈希选一套；台词顺序由 line_order；speaker 对应四色小人尖角指向。
-- 缓存约 5 分钟、兜底文案、相继出现动画等由前端/SSR 实现，不在本迁移中。

CREATE TABLE public.login_brand_dialogue_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT login_brand_dialogue_sets_weight_positive CHECK (weight >= 1)
);

COMMENT ON TABLE public.login_brand_dialogue_sets IS '登录品牌区对话套；仅 enabled=true 的套对 anon 可读；每日选套逻辑在应用层。';
COMMENT ON COLUMN public.login_brand_dialogue_sets.slug IS '可选业务键，便于运营识别与对账。';
COMMENT ON COLUMN public.login_brand_dialogue_sets.weight IS '预留加权抽样；可与日哈希组合扩展。';

CREATE TABLE public.login_brand_dialogue_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.login_brand_dialogue_sets (id) ON DELETE CASCADE,
  line_order int NOT NULL,
  speaker text NOT NULL,
  body_zh text NOT NULL,
  body_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT login_brand_dialogue_lines_order_positive CHECK (line_order >= 1),
  CONSTRAINT login_brand_dialogue_lines_speaker_valid CHECK (
    speaker = ANY (ARRAY['purple'::text, 'black'::text, 'yellow'::text, 'orange'::text])
  ),
  CONSTRAINT login_brand_dialogue_lines_body_zh_nonempty CHECK (length(trim(body_zh)) > 0),
  CONSTRAINT login_brand_dialogue_lines_body_en_nonempty CHECK (length(trim(body_en)) > 0),
  CONSTRAINT login_brand_dialogue_lines_set_order_unique UNIQUE (set_id, line_order)
);

COMMENT ON TABLE public.login_brand_dialogue_lines IS '一套内按 line_order 升序依次播出；speaker 与左侧小人颜色对应。';
COMMENT ON COLUMN public.login_brand_dialogue_lines.speaker IS 'purple | black | yellow | orange，与品牌区几何小人一致。';

CREATE INDEX login_brand_dialogue_sets_enabled_idx
  ON public.login_brand_dialogue_sets (enabled)
  WHERE enabled = true;

CREATE INDEX login_brand_dialogue_lines_set_order_idx
  ON public.login_brand_dialogue_lines (set_id, line_order);

CREATE OR REPLACE FUNCTION public.login_brand_dialogue_sets_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_brand_dialogue_lines_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER login_brand_dialogue_sets_set_updated_at
  BEFORE UPDATE ON public.login_brand_dialogue_sets
  FOR EACH ROW
  EXECUTE PROCEDURE public.login_brand_dialogue_sets_set_updated_at();

CREATE TRIGGER login_brand_dialogue_lines_set_updated_at
  BEFORE UPDATE ON public.login_brand_dialogue_lines
  FOR EACH ROW
  EXECUTE PROCEDURE public.login_brand_dialogue_lines_set_updated_at();

ALTER TABLE public.login_brand_dialogue_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_brand_dialogue_lines ENABLE ROW LEVEL SECURITY;

-- 未登录与已登录用户均可读「已上架」套；写入仅 service_role（控制台 / 后端密钥），无 insert/update policy
CREATE POLICY login_brand_dialogue_sets_select_enabled
  ON public.login_brand_dialogue_sets
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE POLICY login_brand_dialogue_lines_select_under_enabled_set
  ON public.login_brand_dialogue_lines
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.login_brand_dialogue_sets s
      WHERE s.id = set_id
        AND s.enabled = true
    )
  );

GRANT SELECT ON public.login_brand_dialogue_sets TO anon, authenticated;
GRANT SELECT ON public.login_brand_dialogue_lines TO anon, authenticated;
