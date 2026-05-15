-- 登录品牌区对话素材（5 套 × 4 句）。可重复执行：先按 slug 删除旧行再插入。

DELETE FROM public.login_brand_dialogue_sets
WHERE slug IN (
  'prompt-17-times',
  'creator-loop',
  'late-night-avatar',
  'visitors',
  'cyberpunk-not-cyberpunk'
);

DO $$
DECLARE
  s1 uuid;
  s2 uuid;
  s3 uuid;
  s4 uuid;
  s5 uuid;
BEGIN
  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('prompt-17-times', true, 1)
  RETURNING id INTO s1;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s1, 1, 'purple', '他已经改了 17 次 prompt。', 'They''ve already changed the prompt 17 times.'),
    (s1, 2, 'black', '现在加上了「电影感」。', 'Now they''ve added “cinematic vibes.”'),
    (s1, 3, 'yellow', '还有「史诗级光影」。', 'Plus “epic lighting.”'),
    (s1, 4, 'orange', '下一步就是「8K 超清」。', 'Next up will be “8K ultra sharp.”');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('creator-loop', true, 1)
  RETURNING id INTO s2;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s2, 1, 'purple', '白天上班。', 'Day job.'),
    (s2, 2, 'black', '晚上做艺术家。', 'Artist by night.'),
    (s2, 3, 'yellow', '凌晨怀疑人生。', 'Doubting life at 3 a.m.'),
    (s2, 4, 'orange', '这就是创作者循环。', 'That''s the creator loop.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('late-night-avatar', true, 1)
  RETURNING id INTO s3;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s3, 1, 'purple', '这么晚了还不睡？', 'Still awake this late?'),
    (s3, 2, 'black', '他肯定又来生成头像了。', 'They must be here to generate another avatar.'),
    (s3, 3, 'yellow', '这次应该不是「最后改一次」吧？', 'Hopefully this isn''t the “one last tweak” again?'),
    (s3, 4, 'orange', '我已经听过 14 次了。', 'I''ve heard that 14 times already.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('visitors', true, 1)
  RETURNING id INTO s4;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s4, 1, 'purple', '有人来了。', 'Someone''s here.'),
    (s4, 2, 'black', '像是来生成头像的。', 'Looks like they''re making an avatar.'),
    (s4, 3, 'yellow', '也可能是做小红书封面。', 'Or maybe a Xiaohongshu cover.'),
    (s4, 4, 'orange', '希望别再输错密码三次。', 'Let''s hope they don''t mistype the password three times.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('cyberpunk-not-cyberpunk', true, 1)
  RETURNING id INTO s5;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s5, 1, 'purple', '这次 prompt 写清楚了吗？', 'Did they nail the prompt this time?'),
    (s5, 2, 'black', '他说：「来点赛博朋克。」', 'They said: “Make it cyberpunk.”'),
    (s5, 3, 'yellow', '然后又说不要太赛博朋克。', 'Then they said not too cyberpunk.'),
    (s5, 4, 'orange', '人类真复杂。', 'Humans are complicated.');
END $$;
