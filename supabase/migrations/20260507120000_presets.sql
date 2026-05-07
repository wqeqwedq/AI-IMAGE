-- User presets + public inspiration catalog (user_id NULL = platform curated rows)

CREATE TABLE public.presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_image text,
  prompt text NOT NULL DEFAULT '',
  negative_prompt text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT 'gpt-image-2',
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  forks integer NOT NULL DEFAULT 0 CHECK (forks >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT presets_platform_or_owner CHECK (
    user_id IS NOT NULL OR is_public = true
  )
);

CREATE INDEX presets_user_created_idx
  ON public.presets (user_id, created_at DESC);

CREATE INDEX presets_public_likes_idx
  ON public.presets (is_public, likes DESC)
  WHERE is_public = true;

COMMENT ON TABLE public.presets IS '生图预设：用户私有或公开灵感；收藏时复制为当前用户的私有预设。';
COMMENT ON COLUMN public.presets.params IS '与生成表单一致的参数 JSON（含 size、resolution、image_urls 等）。';
COMMENT ON COLUMN public.presets.is_public IS 'true 时在灵感页展示；平台公开行 user_id 可为 NULL。';

ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY presets_select_auth
  ON public.presets
  FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY presets_insert_own
  ON public.presets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY presets_update_own
  ON public.presets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY presets_delete_own
  ON public.presets
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Migrate legacy table if present (created outside this repo in some deployments)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ai_image_user_presets'
  ) THEN
    INSERT INTO public.presets (
      id,
      user_id,
      title,
      cover_image,
      prompt,
      negative_prompt,
      model,
      params,
      is_public,
      likes,
      forks,
      created_at
    )
    SELECT
      id,
      user_id,
      title,
      NULL,
      COALESCE(params->>'prompt', ''),
      COALESCE(params->>'negative_prompt', ''),
      COALESCE(NULLIF(TRIM(params->>'model'), ''), 'gpt-image-2'),
      COALESCE(params, '{}'::jsonb),
      false,
      0,
      0,
      created_at
    FROM public.ai_image_user_presets;

    DROP TABLE public.ai_image_user_presets CASCADE;
  END IF;
END $$;

-- Seed public inspirations (platform rows: user_id NULL)
INSERT INTO public.presets (
  user_id,
  title,
  cover_image,
  prompt,
  negative_prompt,
  model,
  params,
  is_public,
  likes,
  forks
)
VALUES
  (
    NULL,
    '港风夜景写真',
    'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80',
    '香港霓虹街景夜景人像，胶片质感，暖色灯光与冷色阴影对比，雨後地面反光，电影感构图，85mm 虚化背景',
    '过度锐化，畸形手指，文字水印',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"香港霓虹街景夜景人像，胶片质感，暖色灯光与冷色阴影对比，雨後地面反光，电影感构图，85mm 虚化背景","n":1,"size":"2:3","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    12400,
    320
  ),
  (
    NULL,
    '日系清新肖像',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
    '日系透明感肖像，柔和自然光，浅色背景，淡妆，治愈氛围，高清肤质保留细节',
    '浓妆，过曝，塑料皮肤',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"日系透明感肖像，柔和自然光，浅色背景，淡妆，治愈氛围，高清肤质保留细节","n":1,"size":"3:4","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    9800,
    210
  ),
  (
    NULL,
    '赛博朋克城市',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    '赛博朋克未来城市全景，粉紫霓虹，飞行载具光轨，雨雾，超高细节，广角镜头',
    '低分辨率，杂乱构图',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"赛博朋克未来城市全景，粉紫霓虹，飞行载具光轨，雨雾，超高细节，广角镜头","n":1,"size":"16:9","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    15200,
    540
  ),
  (
    NULL,
    '极简产品白底图',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    '极简电商产品摄影，纯白无缝背景，柔和三点布光，金属与玻璃材质高光清晰，居中构图',
    '阴影脏乱，色偏，变形',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"极简电商产品摄影，纯白无缝背景，柔和三点布光，金属与玻璃材质高光清晰，居中构图","n":1,"size":"1:1","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    7600,
    180
  ),
  (
    NULL,
    '古风庭院人像',
    'https://images.unsplash.com/photo-1528164344705-473426861e1a?w=800&q=80',
    '中国古风庭院人像，汉服，竹林与假山背景，午后斜阳，细腻纹理，浅景深',
    '现代元素，西式建筑',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"中国古风庭院人像，汉服，竹林与假山背景，午后斜阳，细腻纹理，浅景深","n":1,"size":"3:2","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    8900,
    260
  ),
  (
    NULL,
    '科幻太空舱内景',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&q=80',
    '科幻太空站内景，冷色面板灯光，舷窗可见星空，宇航员剪影，电影级体积光',
    '卡通风格，低细节',
    'gpt-image-2',
    '{"model":"gpt-image-2","prompt":"科幻太空站内景，冷色面板灯光，舷窗可见星空，宇航员剪影，电影级体积光","n":1,"size":"16:9","resolution":"2k","image_urls":[]}'::jsonb,
    true,
    11100,
    410
  );
