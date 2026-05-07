-- 同一用户对同一条公开灵感的收藏只保留一条（去重）

ALTER TABLE public.presets
  ADD COLUMN IF NOT EXISTS source_preset_id uuid REFERENCES public.presets (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.presets.source_preset_id IS '从灵感页收藏时指向公开预设 id；自建预设为 NULL。';

CREATE UNIQUE INDEX IF NOT EXISTS presets_user_source_preset_unique
  ON public.presets (user_id, source_preset_id)
  WHERE source_preset_id IS NOT NULL AND user_id IS NOT NULL;
