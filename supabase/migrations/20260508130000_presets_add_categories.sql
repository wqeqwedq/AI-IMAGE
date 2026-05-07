-- 预设 / 灵感两级分类

ALTER TABLE public.presets
  ADD COLUMN IF NOT EXISTS primary_category text,
  ADD COLUMN IF NOT EXISTS secondary_category text;

-- 按标题为种子数据归类（与运营示例一致）
UPDATE public.presets
SET primary_category = '内容创作', secondary_category = 'AI写真'
WHERE title = '港风夜景写真';

UPDATE public.presets
SET primary_category = '内容创作', secondary_category = 'AI头像'
WHERE title = '日系清新肖像';

UPDATE public.presets
SET primary_category = '内容创作', secondary_category = '壁纸生成'
WHERE title = '赛博朋克城市';

UPDATE public.presets
SET primary_category = '电商商业', secondary_category = '商品图生成'
WHERE title = '极简产品白底图';

UPDATE public.presets
SET primary_category = '内容创作', secondary_category = 'AI写真'
WHERE title = '古风庭院人像';

UPDATE public.presets
SET primary_category = '设计创意', secondary_category = '建筑概念图'
WHERE title = '科幻太空舱内景';

-- 其余行（含用户自建）：默认一级 / 二级
UPDATE public.presets
SET
  primary_category = '内容创作',
  secondary_category = 'AI写真'
WHERE primary_category IS NULL OR secondary_category IS NULL;

ALTER TABLE public.presets
  ALTER COLUMN primary_category SET NOT NULL,
  ALTER COLUMN secondary_category SET NOT NULL;

ALTER TABLE public.presets
  ALTER COLUMN primary_category SET DEFAULT '内容创作',
  ALTER COLUMN secondary_category SET DEFAULT 'AI写真';

COMMENT ON COLUMN public.presets.primary_category IS '一级分类：内容创作、电商商业等';
COMMENT ON COLUMN public.presets.secondary_category IS '二级分类：与一级组合唯一合法值由应用枚举';

CREATE INDEX IF NOT EXISTS presets_public_category_idx
  ON public.presets (is_public, primary_category, secondary_category)
  WHERE is_public = true;
