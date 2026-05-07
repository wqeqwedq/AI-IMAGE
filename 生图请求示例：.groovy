生图请求示例（不要在仓库或脚本里写死密钥；把 APIMART_API_KEY 放在 Supabase Edge Function Secrets，应用通过 Edge `create-generation-job` 调用 Apimart）：

curl --request POST \
  --url https://api.apimart.ai/v1/images/generations \
  --header "Authorization: Bearer ${APIMART_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gpt-image-2",
    "prompt": "一只橘猫坐在窗台上看夕阳，水彩画风格",
    "n": 1,
    "size": "16:9",
    "resolution": "2k",
    "image_urls": [
    "https://example.com/photo.jpg"
  ]
  }'
  创建接口返回结构（当前文档）：data 为数组，取首项 task_id 再 GET /v1/tasks/{task_id} 轮询。
  {
  "code": 200,
  "data": [
    {
      "status": "submitted",
      "task_id": "task_01KPQ7J7DWB7QZ3WCEK3YVPBRA"
    }
  ]
}
  若 n>1 则 data 中可能有多项，每项对应一个 task_id；本仓库 Edge 与 n=1 对齐取首项。
查询任务状态示例：
curl --request GET \
  --url 'https://api.apimart.ai/v1/tasks/task-unified-1757156493-imcg5zqt?language=zh' \
  --header "Authorization: Bearer ${APIMART_API_KEY}"

返回示例
{
  "code": 200,
  "data": {
    "id": "task_01KA040M0HP1GJWBJYZMKX1XS1",
    "status": "completed",
    "progress": 100,
    "result": {
      "images": [
        {
          "url": [
            "https://upload.apimart.ai/f/image/9998236911693428-e8d7441f-f7b4-4130-97ad-9ef8a0dde2ce-image_task_01KA0413RT2GGNZJ9GWQ4PXF2F_0.png"
          ],
          "expires_at": 1763174708
        }
      ]
    },
    "created": 1763088289,
    "completed": 1763088308,
    "estimated_time": 60,
    "actual_time": 19
  }
}
其中
status
任务状态值：
pending - 排队等待处理
processing - 处理中
completed - 成功完成
failed - 失败
cancelled - 用户取消
