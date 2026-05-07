-- 用户「帮助与反馈」提交；运营在 Supabase Table Editor（service role）查看

CREATE TABLE public.feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feedback_submissions IS '用户提交的反馈正文；无站内管理员回复字段。';

CREATE INDEX feedback_submissions_created_idx
  ON public.feedback_submissions (created_at DESC);

CREATE INDEX feedback_submissions_user_idx
  ON public.feedback_submissions (user_id, created_at DESC);

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_submissions_insert_own
  ON public.feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 普通用户不可 SELECT（避免互相窥探）；控制台 / API 使用 service_role 可读全表
GRANT INSERT ON public.feedback_submissions TO authenticated;
