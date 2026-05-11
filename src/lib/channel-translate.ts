// ============================================================
// TokenScope — Channel Auto-Translation Module
// Automatically generates/translates bilingual descriptions & tags
// for channels fetched by the cron pipeline.
// ============================================================

// ========== Configuration ==========

/** Translation API config — uses any OpenAI-compatible API */
const TRANSLATE_API_URL = process.env.TRANSLATE_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '';
const TRANSLATE_MODEL = process.env.TRANSLATE_MODEL || 'deepseek-chat';

/** Batch size for LLM calls (channels per request) */
const BATCH_SIZE = 5;

/** Whether translation is enabled */
export function isTranslationEnabled(): boolean {
  return TRANSLATE_API_KEY.length > 0;
}

// ========== Static Mappings (zero-cost for common terms) ==========

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  relay: { zh: 'API中转站', en: 'API Relay' },
  proxy: { zh: 'Token代理', en: 'Token Proxy' },
  'free-model': { zh: '免费模型平台', en: 'Free Model Platform' },
  direct: { zh: '官方直连', en: 'Official Direct' },
  hosting: { zh: '模型托管服务', en: 'Model Hosting Service' },
};

const COMMON_TAGS: Record<string, { zh: string; en: string }> = {
  // Model families
  'openai': { zh: 'OpenAI', en: 'OpenAI' },
  'claude': { zh: 'Claude', en: 'Claude' },
  'gemini': { zh: 'Gemini', en: 'Gemini' },
  'gpt': { zh: 'GPT', en: 'GPT' },
  'deepseek': { zh: 'DeepSeek', en: 'DeepSeek' },
  'llama': { zh: 'Llama', en: 'Llama' },
  'qwen': { zh: '通义千问', en: 'Qwen' },
  'glm': { zh: '智谱GLM', en: 'GLM' },
  'mistral': { zh: 'Mistral', en: 'Mistral' },
  'codestral': { zh: 'Codestral', en: 'Codestral' },
  'flux': { zh: 'Flux', en: 'Flux' },
  'sdxl': { zh: 'SDXL', en: 'SDXL' },
  'stable-diffusion': { zh: 'Stable Diffusion', en: 'Stable Diffusion' },
  'whisper': { zh: 'Whisper语音', en: 'Whisper' },
  'tts': { zh: '文字转语音', en: 'TTS' },
  'embedding': { zh: '嵌入模型', en: 'Embedding' },
  // Features
  'multi-model': { zh: '多模型', en: 'Multi-model' },
  'free': { zh: '免费额度', en: 'Free Tier' },
  'low-price': { zh: '低价', en: 'Low Price' },
  'fast': { zh: '低延迟', en: 'Low Latency' },
  'stable': { zh: '稳定', en: 'Stable' },
  'china': { zh: '国内可访问', en: 'China Accessible' },
  'openai-compatible': { zh: 'OpenAI兼容', en: 'OpenAI Compatible' },
  'streaming': { zh: '流式输出', en: 'Streaming' },
};

/** Generate tags from model names using static mapping */
function generateTagsFromModels(modelNames: string[]): { tags: string[]; tagsEn: string[] } {
  const zhSet = new Set<string>();
  const enSet = new Set<string>();

  const allNames = modelNames.join(' ').toLowerCase();

  for (const [keyword, labels] of Object.entries(COMMON_TAGS)) {
    if (allNames.includes(keyword)) {
      zhSet.add(labels.zh);
      enSet.add(labels.en);
    }
  }

  return { tags: Array.from(zhSet), tagsEn: Array.from(enSet) };
}

// ========== Language Detection ==========

/** Simple CJK character detection — returns 'zh' if >30% CJK chars, else 'en' */
function detectLang(text: string): 'zh' | 'en' {
  if (!text) return 'en';
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  const ratio = (cjk?.length || 0) / text.length;
  return ratio > 0.3 ? 'zh' : 'en';
}

// ========== LLM Translation ==========

interface TranslateRequest {
  channelId: string;
  channelName: string;
  channelType: string;
  modelNames: string[];
  description?: string;
  tags?: string[];
  freeTierDescription?: string;
}

interface TranslateResult {
  channelId: string;
  description_zh?: string;
  description_en?: string;
  tags_zh?: string[];
  tags_en?: string[];
  freeTierDescription_zh?: string;
  freeTierDescription_en?: string;
}

/**
 * Translate a batch of channels using LLM.
 * Sends all channels in one request to minimize API calls.
 */
async function translateBatchLLM(batch: TranslateRequest[]): Promise<TranslateResult[]> {
  if (!isTranslationEnabled()) {
    return batch.map(req => ({
      channelId: req.channelId,
      description: req.description,
      descriptionEn: undefined,
      tags: req.tags,
      tagsEn: undefined,
    }));
  }

  const prompt = buildBatchPrompt(batch);

  try {
    const body = {
      model: TRANSLATE_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for an AI model API directory website (TokenScope). 
Translate channel descriptions and tags between Chinese and English.
Rules:
1. Keep technical terms (GPT-4, Claude, API) as-is
2. Descriptions should be concise (1-2 sentences, under 50 words per language)
3. Tags should be 3-6 short keywords
4. Output valid JSON only, no markdown fences`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    };

    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRANSLATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Translation API HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error('[translate] LLM returned empty content');
      return batch.map(req => ({ channelId: req.channelId }));
    }

    // Parse JSON from response (handle possible markdown fences)
    let jsonStr = content;
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1];

    const parsed = JSON.parse(jsonStr);
    const results: TranslateResult[] = parsed.channels || parsed;

    return Array.isArray(results) ? results : [];
  } catch (err: any) {
    console.error(`[translate] LLM batch failed:`, err.message);
    return batch.map(req => ({ channelId: req.channelId }));
  }
}

/** Build the LLM prompt for a batch of channels */
function buildBatchPrompt(batch: TranslateRequest[]): string {
  const items = batch.map((req, i) => {
    const parts = [
      `[${i}] id: ${req.channelId}`,
      `name: ${req.channelName}`,
      `type: ${req.channelType}`,
    ];
    if (req.modelNames.length > 0) {
      parts.push(`models: ${req.modelNames.slice(0, 20).join(', ')}${req.modelNames.length > 20 ? '...' : ''}`);
    }
    if (req.description) {
      const lang = detectLang(req.description);
      parts.push(`description(${lang}): ${req.description}`);
    } else {
      parts.push('description: NONE — generate a brief description based on name, type and models');
    }
    if (req.tags && req.tags.length > 0) {
      parts.push(`tags: ${req.tags.join(', ')}`);
    }
    if (req.freeTierDescription) {
      const lang = detectLang(req.freeTierDescription);
      parts.push(`freeTier(${lang}): ${req.freeTierDescription}`);
    }
    return parts.join('\n');
  });

  return `For each channel below, provide BOTH Chinese (zh) and English (en) versions.
If description exists in one language, translate to the other.
If description is NONE, generate a brief description in both languages based on the channel's name, type, and models.
If tags exist, translate them; if not, generate relevant tags.

Output JSON format:
{
  "channels": [
    {
      "channelId": "...",
      "description_zh": "...",
      "description_en": "...",
      "tags_zh": ["...", "..."],
      "tags_en": ["...", "..."],
      "freeTierDescription_zh": "...",  // only if input has freeTier
      "freeTierDescription_en": "..."   // only if input has freeTier
    }
  ]
}

Channels:
${items.join('\n\n')}`;
}

// ========== Public API ==========

export interface TranslatableChannel {
  id: string;
  name: string;
  type: string;
  description?: string;
  description_en?: string;
  tags?: string[];
  tags_en?: string[];
  free_tier_description?: string;
  free_tier_description_en?: string;
  models?: Array<{ name: string }>;
}

/**
 * Auto-translate a list of parsed channels.
 * For each channel:
 * - If both zh+en exist → skip
 * - If only one language → translate to the other
 * - If neither exists → generate both from name/type/models
 * - Tags are generated from model names via static mapping + LLM
 */
export async function autoTranslateChannels(
  channels: TranslatableChannel[]
): Promise<void> {
  const toTranslate: TranslateRequest[] = [];

  for (const ch of channels) {
    const needsDescription = !ch.description || !ch.description_en;
    const needsTags = !ch.tags || ch.tags.length === 0 || !ch.tags_en || ch.tags_en.length === 0;
    const needsFreeTier = ch.free_tier_description && !ch.free_tier_description_en;

    if (needsDescription || needsTags || needsFreeTier) {
      toTranslate.push({
        channelId: ch.id,
        channelName: ch.name,
        channelType: ch.type,
        modelNames: (ch.models || []).map(m => m.name),
        description: ch.description || ch.description_en,
        tags: ch.tags || ch.tags_en,
        freeTierDescription: ch.free_tier_description || ch.free_tier_description_en,
      });
    } else {
      // Both languages exist, nothing to do
    }
  }

  if (toTranslate.length === 0) {
    console.log('[translate] All channels already bilingual, nothing to translate');
    return;
  }

  console.log(`[translate] ${toTranslate.length} channels need translation/generation`);

  // Apply static tag mappings first (zero-cost)
  for (const ch of channels) {
    const modelNames = (ch.models || []).map(m => m.name);
    if (modelNames.length > 0) {
      const staticTags = generateTagsFromModels(modelNames);
      if (!ch.tags || ch.tags.length === 0) ch.tags = staticTags.tags;
      if (!ch.tags_en || ch.tags_en.length === 0) ch.tags_en = staticTags.tagsEn;
    }

    // Add type label tag if missing
    const typeLabel = TYPE_LABELS[ch.type];
    if (typeLabel) {
      if (ch.tags && !ch.tags.includes(typeLabel.zh)) ch.tags.push(typeLabel.zh);
      if (ch.tags_en && !ch.tags_en.includes(typeLabel.en)) ch.tags_en.push(typeLabel.en);
    }
  }

  // If no API key, static mappings are all we can do
  if (!isTranslationEnabled()) {
    console.log('[translate] No TRANSLATE_API_KEY set, using static mappings only');
    // For channels without any description, generate a basic one from type+name
    for (const ch of channels) {
      if (!ch.description) {
        const typeLabel = TYPE_LABELS[ch.type] || { zh: '服务', en: 'Service' };
        ch.description = `${ch.name} — ${typeLabel.zh}`;
      }
      if (!ch.description_en) {
        const typeLabel = TYPE_LABELS[ch.type] || { zh: '', en: 'Service' };
        ch.description_en = `${ch.name} — ${typeLabel.en}`;
      }
    }
    return;
  }

  // Process in batches
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const results = await translateBatchLLM(batch);

    // Apply results back to channels
    for (const result of results) {
      const ch = channels.find(c => c.id === result.channelId);
      if (!ch) continue;

      // Apply translations — only fill missing fields, don't overwrite existing
      if (result.description_zh && !ch.description) {
        ch.description = result.description_zh;
      }
      if (result.description_en && !ch.description_en) {
        ch.description_en = result.description_en;
      }
      if (result.tags_zh && result.tags_zh.length > 0 && (!ch.tags || ch.tags.length === 0)) {
        ch.tags = result.tags_zh;
      }
      if (result.tags_en && result.tags_en.length > 0 && (!ch.tags_en || ch.tags_en.length === 0)) {
        ch.tags_en = result.tags_en;
      }
      if (result.freeTierDescription_zh && !ch.free_tier_description) {
        ch.free_tier_description = result.freeTierDescription_zh;
      }
      if (result.freeTierDescription_en && !ch.free_tier_description_en) {
        ch.free_tier_description_en = result.freeTierDescription_en;
      }
    }
  }

  console.log(`[translate] Completed for ${toTranslate.length} channels`);
}

/**
 * Translate a single text string (for ad-hoc use).
 * Returns the translated text, or the original if translation fails.
 */
export async function translateText(
  text: string,
  fromLang: 'zh' | 'en',
  toLang: 'zh' | 'en'
): Promise<string> {
  if (!isTranslationEnabled()) return text;
  if (fromLang === toLang) return text;

  const targetLabel = toLang === 'zh' ? 'Chinese' : 'English';

  try {
    const body = {
      model: TRANSLATE_MODEL,
      messages: [
        {
          role: 'system',
          content: `Translate the following text to ${targetLabel}. Output only the translation, no explanations.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    };

    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRANSLATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Translation API HTTP ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };

    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (err: any) {
    console.error(`[translateText] Failed:`, err.message);
    return text;
  }
}
