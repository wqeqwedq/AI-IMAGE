-- 登录品牌区对话：新增 11 套 × 4 句（与 20260518120000 并存）。按 slug 删除后插入，可重复执行。

DELETE FROM public.login_brand_dialogue_sets
WHERE slug IN (
  'cyberpunk-but-subtle',
  'progress-meinv-to-essay',
  'vague-high-end-brief',
  'work-hours-inspiration',
  'cinematic-sounds-expensive',
  'login-page-contemplation',
  'premium-gray-english',
  'long-prompt-short-win',
  'translucent-breathing-memes',
  'masterpiece-god-camera',
  'ai-art-human-taste'
);

DO $$
DECLARE
  s1 uuid;
  s2 uuid;
  s3 uuid;
  s4 uuid;
  s5 uuid;
  s6 uuid;
  s7 uuid;
  s8 uuid;
  s9 uuid;
  s10 uuid;
  s11 uuid;
BEGIN
  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('cyberpunk-but-subtle', true, 1)
  RETURNING id INTO s1;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s1, 1, 'purple', '今天生成什么？', 'What are we generating today?'),
    (s1, 2, 'black', '赛博朋克。', 'Cyberpunk.'),
    (s1, 3, 'yellow', '但是不要太赛博朋克。', 'But not too cyberpunk.'),
    (s1, 4, 'orange', '人类总能提出新难题。', 'Humans always invent a new impossible ask.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('progress-meinv-to-essay', true, 1)
  RETURNING id INTO s2;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s2, 1, 'purple', '最开始他只会输入「美女」。', 'At first they only typed “beautiful woman.”'),
    (s2, 2, 'black', '后来学会了「电影感」。', 'Then they learned “cinematic vibes.”'),
    (s2, 3, 'yellow', '现在已经能写三百字。', 'Now they can ramble for three hundred characters.'),
    (s2, 4, 'orange', '人类适应能力真强。', 'Humans adapt fast.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('vague-high-end-brief', true, 1)
  RETURNING id INTO s3;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s3, 1, 'purple', '用户输入：「高级一点。」', 'User input: “Make it more premium.”'),
    (s3, 2, 'black', '好抽象的需求。', 'That''s a vague brief.'),
    (s3, 3, 'yellow', '再加个「氛围感」。', 'Plus some “vibes.”'),
    (s3, 4, 'orange', '建议直接读取脑电波。', 'Might as well read their brainwaves.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('work-hours-inspiration', true, 1)
  RETURNING id INTO s4;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s4, 1, 'purple', '现在是工作时间。', 'It''s still work hours.'),
    (s4, 2, 'black', '但他打开了 AI 生图。', 'But they opened AI image gen.'),
    (s4, 3, 'yellow', '说明灵感比 KPI 更重要。', 'Guess inspiration beats KPIs.'),
    (s4, 4, 'orange', '或者老板不在。', 'Or the boss is out.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('cinematic-sounds-expensive', true, 1)
  RETURNING id INTO s5;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s5, 1, 'purple', '为什么所有人都想要电影感？', 'Why does everyone want a “movie look”?'),
    (s5, 2, 'black', '因为听起来贵。', 'Because it sounds expensive.'),
    (s5, 3, 'yellow', '再加一句「奥斯卡级别」。', 'And add “Oscar-worthy” while you''re at it.'),
    (s5, 4, 'orange', 'AI 快信了。', 'The model almost buys it.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('login-page-contemplation', true, 1)
  RETURNING id INTO s6;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s6, 1, 'purple', '他停留在登录页五分钟了。', 'They''ve been staring at the login page for five minutes.'),
    (s6, 2, 'black', '像是在思考人生。', 'Like an existential crisis.'),
    (s6, 3, 'yellow', '也可能在想 prompt。', 'Or they''re stuck on the prompt.'),
    (s6, 4, 'orange', '或者忘了密码。', 'Or they forgot the password.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('premium-gray-english', true, 1)
  RETURNING id INTO s7;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s7, 1, 'purple', '他说想要「高级感」。', 'They asked for a “premium feel.”'),
    (s7, 2, 'black', '于是加了灰色。', 'So we added more gray.'),
    (s7, 3, 'yellow', '还有英文字母。', 'And some English letters.'),
    (s7, 4, 'orange', '高级感完成。', 'Premium feel: achieved.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('long-prompt-short-win', true, 1)
  RETURNING id INTO s8;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s8, 1, 'purple', '他认真写了三百字 prompt。', 'They wrote a serious three-hundred-character prompt.'),
    (s8, 2, 'black', '最后效果一般。', 'The result was mid.'),
    (s8, 3, 'yellow', '后来随手输入「绝美」。', 'Then they typed “absolutely gorgeous” on a whim.'),
    (s8, 4, 'orange', '出神图了。', 'Masterpiece unlocked.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('translucent-breathing-memes', true, 1)
  RETURNING id INTO s9;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s9, 1, 'purple', '他说图「不够通透」。', 'They said the image wasn''t “clear” enough.'),
    (s9, 2, 'black', '我至今没理解。', 'I still don''t get it.'),
    (s9, 3, 'yellow', '还有「呼吸感」。', 'And something about “breathability.”'),
    (s9, 4, 'orange', '空气成精了。', 'The air gained sentience.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('masterpiece-god-camera', true, 1)
  RETURNING id INTO s10;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s10, 1, 'purple', '他加了「大师级构图」。', 'They added “master-level composition.”'),
    (s10, 2, 'black', '又加了「获奖作品」。', 'Plus “award-winning work.”'),
    (s10, 3, 'yellow', '现在还要「神明视角」。', 'Now they want a “god''s-eye view.”'),
    (s10, 4, 'orange', '下一步直接召唤艺术之神。', 'Next step: summon the muse.');

  INSERT INTO public.login_brand_dialogue_sets (slug, enabled, weight)
  VALUES ('ai-art-human-taste', true, 1)
  RETURNING id INTO s11;

  INSERT INTO public.login_brand_dialogue_lines (set_id, line_order, speaker, body_zh, body_en)
  VALUES
    (s11, 1, 'purple', '其实 AI 不懂艺术。', 'Truth is, AI doesn''t understand art.'),
    (s11, 2, 'black', '也不懂审美。', 'Or taste.'),
    (s11, 3, 'yellow', '那为什么还能生成好图？', 'So how does it still make great images?'),
    (s11, 4, 'orange', '因为人类也说不清什么是好看。', 'Because humans can''t define “good” either.');
END $$;
