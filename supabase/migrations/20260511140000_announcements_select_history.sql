-- 允许已登录用户读取「已发布且已开始」的全部公告（含已结束），用于顶栏历史列表；弹窗仍只拉时间窗内最新一条

DROP POLICY IF EXISTS announcements_select_active_window ON public.announcements;

CREATE POLICY announcements_select_published_started
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (is_published = true AND starts_at <= now());
