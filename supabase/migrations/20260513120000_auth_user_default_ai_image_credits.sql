-- 新用户在 auth.users 创建时，自动写入 ai_image_credits：生图额度 10（剩余与上限一致）。
-- 使用 SECURITY DEFINER，以便在 RLS 下仍能插入 public.ai_image_credits。

CREATE OR REPLACE FUNCTION public.handle_new_user_default_ai_image_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_image_credits (
    user_id,
    image_generation_count,
    max_image_generation_count,
    model_training_count,
    max_model_training_count
  )
  SELECT
    NEW.id,
    10,
    10,
    0,
    0
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.ai_image_credits c
    WHERE c.user_id = NEW.id
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user_default_ai_image_credits() IS
  'auth.users 插入后为新用户创建 ai_image_credits：生图 10 次，训练 0 次。';

DROP TRIGGER IF EXISTS on_auth_user_created_default_ai_image_credits ON auth.users;

CREATE TRIGGER on_auth_user_created_default_ai_image_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_default_ai_image_credits();
