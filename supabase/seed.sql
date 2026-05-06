-- ============================================================
-- TokenScope - Migration + Seed Data
-- Changes channels.id from UUID to TEXT (slug-based)
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop foreign key constraints temporarily
ALTER TABLE public.models DROP CONSTRAINT IF EXISTS models_channel_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_channel_id_fkey;
ALTER TABLE public.channel_submissions DROP CONSTRAINT IF EXISTS channel_submissions_channel_id_fkey;
ALTER TABLE public.uptime_checks DROP CONSTRAINT IF EXISTS uptime_checks_channel_id_fkey;
ALTER TABLE public.review_votes DROP CONSTRAINT IF EXISTS review_votes_review_id_fkey;

-- Step 2: Change id types
ALTER TABLE public.channels ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.models ALTER COLUMN channel_id TYPE TEXT USING channel_id::TEXT;
ALTER TABLE public.reviews ALTER COLUMN channel_id TYPE TEXT USING channel_id::TEXT;
ALTER TABLE public.channel_submissions ALTER COLUMN channel_id TYPE TEXT USING channel_id::TEXT;
ALTER TABLE public.uptime_checks ALTER COLUMN channel_id TYPE TEXT USING channel_id::TEXT;

-- Step 3: Recreate foreign keys
ALTER TABLE public.models ADD CONSTRAINT models_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;
ALTER TABLE public.channel_submissions ADD CONSTRAINT channel_submissions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;
ALTER TABLE public.uptime_checks ADD CONSTRAINT uptime_checks_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- Step 4: Remove UUID default, no auto-generate for TEXT id
ALTER TABLE public.channels ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.models ALTER COLUMN id DROP DEFAULT;

-- ============================================================
-- Seed Data: 7 Channels
-- ============================================================

INSERT INTO public.channels (id, name, type, description, description_en, url, status, cert_level, region, tags, tags_en, payment_methods, free_tier_available, free_tier_description, free_tier_description_en, avg_latency, uptime_30d, review_count, rating_overall, rating_stability, rating_speed, rating_service, rating_value, rating_count, featured, created_at, updated_at) VALUES

('siliconflow', '硅基流动 SiliconFlow', 'direct',
 '国内领先的大模型推理平台，提供 DeepSeek、Qwen 等国产模型的低延迟 API，价格极具竞争力，部分模型免费使用。',
 'Leading Chinese LLM inference platform with low-latency API for DeepSeek, Qwen and more. Competitive pricing with free tier available.',
 'https://siliconflow.cn', 'online', 'verified',
 ARRAY['cn','global'], ARRAY['国产模型','低价','免费额度','DeepSeek','Qwen'], ARRAY['Chinese Models','Low Price','Free Tier','DeepSeek','Qwen'],
 ARRAY['alipay','wechat','credit-card'],
 TRUE, 'DeepSeek V3/R1 免费调用，每分钟14次', 'Free DeepSeek V3/R1, 14 calls/min',
 320, 99.2, 156, 4.5, 4.3, 4.6, 4.2, 4.8, 156, TRUE, '2024-01-15', '2026-04-28'),

('deepseek-official', 'DeepSeek 官方', 'direct',
 'DeepSeek 官方 API，全球最便宜的高性能模型之一，代码和数学能力突出，V3 和 R1 均支持。',
 'Official DeepSeek API — one of the world''s cheapest high-performance models. Excels at code and math.',
 'https://platform.deepseek.com', 'online', 'premium',
 ARRAY['cn','global'], ARRAY['官方','DeepSeek','超低价','代码能力强','推理模型'], ARRAY['Official','DeepSeek','Ultra Low Price','Strong Code','Reasoning'],
 ARRAY['alipay','credit-card'],
 FALSE, NULL, NULL,
 450, 98.5, 892, 4.7, 4.5, 4.4, 4.3, 4.9, 892, TRUE, '2024-06-01', '2026-05-01'),

('groq', 'Groq', 'free-model',
 '超高速 LLM 推理平台，基于 LPU 芯片实现极低延迟，免费提供 Llama 3、Mixtral 等开源模型 API。',
 'Ultra-fast LLM inference on LPU chips. Free API for Llama 3, Mixtral, and other open-source models.',
 'https://groq.com', 'online', 'verified',
 ARRAY['us','global'], ARRAY['免费','超高速','Llama','Mixtral','开源模型'], ARRAY['Free','Ultra Fast','Llama','Mixtral','Open Source'],
 ARRAY['credit-card'],
 TRUE, '所有模型免费使用，有速率限制', 'All models free with rate limits',
 80, 97.8, 234, 4.3, 4.0, 4.9, 3.8, 4.8, 234, TRUE, '2024-03-01', '2026-04-30'),

('nvidia-nim', 'NVIDIA NIM', 'free-model',
 'NVIDIA 官方提供的免费大模型 API，包含 Llama、Mistral 等主流模型，开发者友好。',
 'NVIDIA''s free LLM API featuring Llama, Mistral, and more. Developer-friendly with generous free tier.',
 'https://build.nvidia.com', 'online', 'verified',
 ARRAY['us','global'], ARRAY['免费','NVIDIA','Llama','Mistral','官方'], ARRAY['Free','NVIDIA','Llama','Mistral','Official'],
 ARRAY['free','credit-card'],
 TRUE, '每天1000次免费调用', '1000 free requests per day',
 150, 99.0, 128, 4.1, 4.2, 4.3, 4.0, 4.6, 128, TRUE, '2024-06-15', '2026-04-25'),

('cf-workers-ai', 'Cloudflare Workers AI', 'free-model',
 'Cloudflare 边缘计算提供的免费 AI 推理服务，全球 300+ 节点，延迟极低，模型丰富。',
 'Free AI inference on Cloudflare''s edge network. 300+ global PoPs, ultra-low latency, rich model library.',
 'https://ai.cloudflare.com', 'online', 'premium',
 ARRAY['us','eu','asia','global'], ARRAY['免费','边缘计算','全球加速','Cloudflare','开源模型'], ARRAY['Free','Edge Computing','Global CDN','Cloudflare','Open Source'],
 ARRAY['free','credit-card'],
 TRUE, '每天10000个神经元免费额度', '10,000 free neurons per day',
 50, 99.9, 96, 4.2, 4.5, 4.7, 4.1, 4.7, 96, TRUE, '2024-05-01', '2026-04-28'),

('openrouter', 'OpenRouter', 'relay',
 '多模型聚合中转站，一个 API 接入 200+ 模型，支持 GPT、Claude、Gemini、Llama 等，价格透明。',
 'Multi-model aggregator — one API for 200+ models including GPT, Claude, Gemini, Llama. Transparent pricing.',
 'https://openrouter.ai', 'online', 'verified',
 ARRAY['us','global'], ARRAY['多模型','OpenAI','Claude','Gemini','价格透明'], ARRAY['Multi-model','OpenAI','Claude','Gemini','Transparent'],
 ARRAY['credit-card','crypto'],
 FALSE, NULL, NULL,
 280, 99.1, 567, 4.4, 4.3, 4.2, 4.4, 4.5, 567, TRUE, '2024-01-01', '2026-05-01'),

('together-ai', 'Together AI', 'hosting',
 '开源模型托管推理平台，提供 Llama、Qwen、FLUX 等热门模型的 API，价格低廉且推理速度快。',
 'Open-source model hosting with fast inference. Llama, Qwen, FLUX and more at competitive prices.',
 'https://together.ai', 'online', 'verified',
 ARRAY['us','global'], ARRAY['开源模型','Llama','FLUX','图像生成','推理速度快'], ARRAY['Open Source','Llama','FLUX','Image Gen','Fast'],
 ARRAY['credit-card'],
 FALSE, NULL, NULL,
 200, 99.3, 145, 4.3, 4.4, 4.3, 4.2, 4.4, 145, FALSE, '2024-02-01', '2026-04-20')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description,
  description_en = EXCLUDED.description_en, url = EXCLUDED.url, status = EXCLUDED.status,
  cert_level = EXCLUDED.cert_level, region = EXCLUDED.region, tags = EXCLUDED.tags,
  tags_en = EXCLUDED.tags_en, payment_methods = EXCLUDED.payment_methods,
  free_tier_available = EXCLUDED.free_tier_available, free_tier_description = EXCLUDED.free_tier_description,
  free_tier_description_en = EXCLUDED.free_tier_description_en, avg_latency = EXCLUDED.avg_latency,
  uptime_30d = EXCLUDED.uptime_30d, review_count = EXCLUDED.review_count,
  rating_overall = EXCLUDED.rating_overall, rating_stability = EXCLUDED.rating_stability,
  rating_speed = EXCLUDED.rating_speed, rating_service = EXCLUDED.rating_service,
  rating_value = EXCLUDED.rating_value, rating_count = EXCLUDED.rating_count,
  featured = EXCLUDED.featured, updated_at = EXCLUDED.updated_at;

-- ============================================================
-- Seed Data: Models
-- ============================================================

-- First clear old models to avoid duplicates
DELETE FROM public.models;

INSERT INTO public.models (id, channel_id, name, category, input_price_per_1m, output_price_per_1m, is_free, free_quota, context_window) VALUES
-- SiliconFlow
('sf-deepseek-v3', 'siliconflow', 'DeepSeek V3', 'chat', 0.27, 1.10, TRUE, '14 free calls/min', 131072),
('sf-deepseek-r1', 'siliconflow', 'DeepSeek R1', 'reasoning', 0.55, 2.19, TRUE, 'Limited free calls', 131072),
('sf-qwen2.5-72b', 'siliconflow', 'Qwen 2.5 72B', 'chat', 0.40, 1.20, FALSE, NULL, 131072),
('sf-glm-4-plus', 'siliconflow', 'GLM-4 Plus', 'chat', 0.50, 1.50, FALSE, NULL, 131072),

-- DeepSeek Official
('ds-deepseek-v3', 'deepseek-official', 'DeepSeek V3', 'chat', 0.27, 1.10, FALSE, NULL, 131072),
('ds-deepseek-r1', 'deepseek-official', 'DeepSeek R1', 'reasoning', 0.55, 2.19, FALSE, NULL, 131072),
('ds-deepseek-coder', 'deepseek-official', 'DeepSeek Coder', 'code', 0.14, 0.28, FALSE, NULL, 131072),

-- Groq
('groq-llama-3.3-70b', 'groq', 'Llama 3.3 70B', 'chat', NULL, NULL, TRUE, 'Rate limited', 131072),
('groq-mixtral-8x7b', 'groq', 'Mixtral 8x7B', 'chat', NULL, NULL, TRUE, 'Rate limited', 32768),
('groq-gemma2-9b', 'groq', 'Gemma 2 9B', 'chat', NULL, NULL, TRUE, 'Rate limited', 8192),

-- NVIDIA NIM
('nim-llama-3.1-405b', 'nvidia-nim', 'Llama 3.1 405B', 'chat', NULL, NULL, TRUE, '1000 req/day', 131072),
('nim-mistral-large', 'nvidia-nim', 'Mistral Large', 'chat', NULL, NULL, TRUE, '1000 req/day', 32768),

-- Cloudflare Workers AI
('cf-llama-3.1-8b', 'cf-workers-ai', 'Llama 3.1 8B', 'chat', NULL, NULL, TRUE, '10K neurons/day', 8192),
('cf-mistral-7b', 'cf-workers-ai', 'Mistral 7B', 'chat', NULL, NULL, TRUE, '10K neurons/day', 8192),

-- OpenRouter
('or-gpt-4o', 'openrouter', 'GPT-4o', 'chat', 2.50, 10.00, FALSE, NULL, 128000),
('or-claude-3.5-sonnet', 'openrouter', 'Claude 3.5 Sonnet', 'chat', 3.00, 15.00, FALSE, NULL, 200000),
('or-gemini-2.5-pro', 'openrouter', 'Gemini 2.5 Pro', 'chat', 1.25, 10.00, FALSE, NULL, 1048576),
('or-deepseek-v3', 'openrouter', 'DeepSeek V3', 'chat', 0.14, 0.28, FALSE, NULL, 131072),

-- Together AI
('ta-llama-3.3-70b', 'together-ai', 'Llama 3.3 70B', 'chat', 0.88, 0.88, FALSE, NULL, 131072),
('ta-qwen2.5-72b', 'together-ai', 'Qwen 2.5 72B', 'chat', 0.60, 0.60, FALSE, NULL, 131072),
('ta-flux-1.1-pro', 'together-ai', 'FLUX 1.1 Pro', 'image', 0.04, 0.04, FALSE, NULL, NULL);

-- ============================================================
-- Verify
-- ============================================================
-- SELECT id, name, type FROM public.channels ORDER BY rating_overall DESC;
-- SELECT channel_id, name, category, is_free FROM public.models ORDER BY channel_id;
