-- poll-apimart-jobs：仅在 Apimart data.status 为 completed（按结果）/ failed / cancelled 时 settle；不因创建时长自动失败
COMMENT ON COLUMN public.ai_image_generation_jobs.poll_count IS 'poll-apimart-jobs 已轮询次数（统计用）。任务终态仅由 Apimart data.status（completed/failed/cancelled）决定；HTTP 或非预期 JSON 时继续轮询，不因任务创建时长自动结算失败。';
