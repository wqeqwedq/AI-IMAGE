-- 示例：插入一套对话（先在 sets 得到 id，再插 lines）。上线前将 enabled 改为 true。
-- 在 SQL Editor 以 service role 执行，或通过应用服务端写入。

/*
WITH s AS (
  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('demo-v1', false, 1)
  RETURNING id
)
INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
SELECT id, v.line_order, v.speaker::text, v.body_zh, v.body_en
FROM s
CROSS JOIN (
  VALUES
    (1, 'purple',  '占位：紫色第一句', 'Placeholder: purple line 1'),
    (2, 'black',   '占位：黑色第二句', 'Placeholder: black line 2'),
    (3, 'yellow',  '占位：黄色第三句', 'Placeholder: yellow line 3'),
    (4, 'orange',  '占位：橙色第四句', 'Placeholder: orange line 4')
) AS v(line_order, speaker, body_zh, body_en);
*/
