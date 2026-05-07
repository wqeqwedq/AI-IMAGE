-- 业务表与关键列注释（中文）。不删除任何对象。

-- ai_image_credits
COMMENT ON TABLE public.ai_image_credits IS '每位用户一行：生图/训练剩余次数及套餐上限；由 Stripe webhook、业务逻辑与 RPC ai_image_start_generation_job 更新。';
COMMENT ON COLUMN public.ai_image_credits.user_id IS '对应 auth.users.id，唯一。';
COMMENT ON COLUMN public.ai_image_credits.image_generation_count IS '当前剩余生图次数（按次扣减，与分辨率定价一致）。';
COMMENT ON COLUMN public.ai_image_credits.max_image_generation_count IS '套餐允许的生图次数上限。';
COMMENT ON COLUMN public.ai_image_credits.model_training_count IS '当前剩余模型训练次数。';
COMMENT ON COLUMN public.ai_image_credits.max_model_training_count IS '套餐允许的训练次数上限。';

-- ai_image_generation_jobs
COMMENT ON TABLE public.ai_image_generation_jobs IS 'Apimart 异步生图任务：结果 URL 仅存本表；由 Edge create-generation-job / poll-apimart-jobs 与 RPC ai_image_start_generation_job 写入。';
COMMENT ON COLUMN public.ai_image_generation_jobs.external_task_id IS 'Apimart 创建接口返回的 data.id。';
COMMENT ON COLUMN public.ai_image_generation_jobs.request_payload IS '创建请求体快照（model、prompt、n、size、resolution、image_urls 等），便于排错与对账。';
COMMENT ON COLUMN public.ai_image_generation_jobs.status IS 'polling=等待轮询；succeeded=已得图 URL；failed=失败/取消/轮询超限。';
COMMENT ON COLUMN public.ai_image_generation_jobs.result_url IS '成功时首张图 URL（与 n=1 一致）；不进 Storage。';
COMMENT ON COLUMN public.ai_image_generation_jobs.poll_count IS 'poll-apimart-jobs 已轮询次数，用于上限判断。';
COMMENT ON COLUMN public.ai_image_generation_jobs.last_polled_at IS '最近一次被 Cron 轮询的时间。';

-- ai_image_generated_images
COMMENT ON TABLE public.ai_image_generated_images IS '画廊元数据：与 Storage 桶 ai_image_generated_images 中对象对应；历史上传/旧流程使用，异步 Apimart 成功图可不写入。';
COMMENT ON COLUMN public.ai_image_generated_images.image_name IS 'Storage 内相对路径中的文件名（与 user_id 前缀组成完整路径）。';
COMMENT ON COLUMN public.ai_image_generated_images.aspect_ratio IS '展示用比例标签，可为 size·resolution 等拼接。';

-- ai_image_generation_scenarios
COMMENT ON TABLE public.ai_image_generation_scenarios IS '内置生图场景/示例：slug、标题、默认 params（JSON），供前端展示与一键填充。';
COMMENT ON COLUMN public.ai_image_generation_scenarios.params IS '与 generation-params 一致的 JSON 默认参数。';
COMMENT ON COLUMN public.ai_image_generation_scenarios.sort_order IS '列表展示排序，数值越小越靠前。';

-- ai_image_user_presets
COMMENT ON TABLE public.ai_image_user_presets IS '用户保存的生图参数预设：标题 + params JSON。';
COMMENT ON COLUMN public.ai_image_user_presets.params IS '与表单一致的生图参数 JSON。';

-- Stripe 镜像（产品与订阅）
COMMENT ON TABLE public.ai_image_products IS 'Stripe Product 镜像：计费页展示与关联价格。';
COMMENT ON TABLE public.ai_image_prices IS 'Stripe Price 镜像：关联 product_id、币种、周期等。';
COMMENT ON TABLE public.ai_image_subscriptions IS 'Stripe Subscription 镜像：用户订阅状态与当前周期。';
COMMENT ON COLUMN public.ai_image_subscriptions.price_id IS '关联 ai_image_prices.id。';
