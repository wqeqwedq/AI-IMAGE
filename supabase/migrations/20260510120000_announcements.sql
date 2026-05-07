-- 站内公告（登录后弹窗）；运营在控制台维护 announcements，用户在 announcement_reads 记录「已读」

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_time_range CHECK (ends_at > starts_at)
);

COMMENT ON TABLE public.announcements IS '全站公告；同时仅应有一条 is_published 且在时间窗内，应用层取 created_at 最新一条。';
COMMENT ON COLUMN public.announcements.body IS 'Markdown 或 HTML（控制台可信来源）；前端对 HTML 直接渲染。';

CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.announcements (id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcement_reads_user_announcement_unique UNIQUE (user_id, announcement_id)
);

CREATE INDEX announcements_active_list_idx
  ON public.announcements (is_published, starts_at DESC, ends_at DESC);

CREATE INDEX announcement_reads_user_idx
  ON public.announcement_reads (user_id, announcement_id);

CREATE OR REPLACE FUNCTION public.announcements_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE PROCEDURE public.announcements_set_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- 登录用户仅可读「已发布且在时间窗内」的公告（控制台用 service role 维护全表）
CREATE POLICY announcements_select_active_window
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND starts_at <= now()
    AND ends_at >= now()
  );

CREATE POLICY announcement_reads_select_own
  ON public.announcement_reads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY announcement_reads_insert_own
  ON public.announcement_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.announcements TO authenticated;
GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;

-- 在 SQL Editor 插入示例（需 is_published=true 且在时间窗内）：
-- INSERT INTO public.announcements (title, body, starts_at, ends_at, is_published)
-- VALUES ('维护通知', '今晚 **22:00–23:00** 系统维护。', now() - interval '1 day', now() + interval '30 days', true);
