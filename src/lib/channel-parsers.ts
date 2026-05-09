// ============================================================
// TokenScope — Channel Parsers (Relay/Proxy Focus)
// ============================================================

import { fetchHtml, fetchJson, extractJsonFromHtml, parseMarkdownTable, extractMarkdownLinks } from './channel-fetch';

// ========== Types ==========

export interface ParsedChannelData {
  channel: Record<string, any>;
  models: Record<string, any>[];
}

export interface ParsedDiscoveryResult {
  discoveredStations: Array<{ name: string; url: string; notes?: string }>;
}

export type ParseResult = ParsedChannelData | ParsedDiscoveryResult | null;

// ========== Relay Station Parsers ==========

/** Generic New API / One API /v1/models parser */
export async function parseRelayModels(
  apiUrl: string, channelId: string, channelName: string
): Promise<ParsedChannelData | null> {
  try {
    const data = await fetchJson<{ data: Array<{ id: string }> }>(apiUrl, { timeoutMs: 10000 });
    if (!data?.data || !Array.isArray(data.data)) return null;

    // Derive site URL from API URL (e.g. https://api.example.com/v1/models → https://example.com)
    const siteUrl = apiUrl
      .replace(/\/v1\/models\/?$/, '')
      .replace(/\/v1\/?$/, '')
      .replace(/api\./, '');

    const channel: Record<string, any> = {
      id: channelId, name: channelName, type: 'relay',
      url: siteUrl, status: 'online', updated_at: new Date().toISOString(),
    };

    const models = data.data
      .filter(m => m.id && m.id !== '')
      .map(m => ({
        channel_id: channelId, name: m.id,
        category: guessCategory(m.id),
      }));

    console.log(`[parseRelayModels] ${channelId}: ${models.length} models`);
    return { channel, models };
  } catch (err: any) {
    console.error(`[parseRelayModels] ${channelId} failed:`, err.message);
    return null;
  }
}

/** OpenRouter — dedicated parser with pricing */
export async function parseOpenRouter(): Promise<ParsedChannelData | null> {
  try {
    const data = await fetchJson<{ data: Array<Record<string, any>> }>(
      'https://openrouter.ai/api/v1/models', { timeoutMs: 15000 }
    );
    if (!data?.data || !Array.isArray(data.data)) return null;

    const channel: Record<string, any> = {
      id: 'openrouter', name: 'OpenRouter', type: 'relay',
      description: '多模型聚合中转站，一个 API 接入 200+ 模型。',
      description_en: 'Multi-model aggregator — one API for 200+ models.',
      url: 'https://openrouter.ai', doc_url: 'https://openrouter.ai/docs',
      status: 'online', cert_level: 'verified', region: ['us', 'global'],
      tags: ['多模型', 'OpenAI', 'Claude', 'Gemini'],
      tags_en: ['Multi-model', 'OpenAI', 'Claude', 'Gemini'],
      payment_methods: ['credit-card', 'crypto'],
      rating_overall: 4.4, rating_stability: 4.3, rating_speed: 4.2,
      rating_service: 4.4, rating_value: 4.5, rating_count: 567,
      avg_latency: 280, uptime_30d: 99.1, review_count: 567,
      featured: true, updated_at: new Date().toISOString(),
    };

    const models: Record<string, any>[] = [];
    for (const m of data.data) {
      try {
        const p = m.pricing || {};
        const inp = parsePriceToPer1M(p.prompt);
        const out = parsePriceToPer1M(p.completion);
        const isFree = inp === 0 && out === 0;
        models.push({
          channel_id: 'openrouter', name: m.id, category: guessCategory(m.id, m.name),
          input_price_per_1m: inp, output_price_per_1m: out,
          is_free: isFree, free_quota: isFree ? 'Free on OpenRouter' : null,
          context_window: m.context_length || null,
        });
      } catch { /* skip */ }
    }

    console.log(`[parseOpenRouter] ${models.length} models`);
    return { channel, models };
  } catch (err: any) {
    console.error('[parseOpenRouter] Failed:', err.message);
    return null;
  }
}

// ========== Community List Parsers ==========

/** Parse zzsting88/relayAPI README */
export async function parseRelayAPIGitHub(): Promise<ParsedDiscoveryResult | null> {
  try {
    const md = await fetchHtml(
      'https://raw.githubusercontent.com/zzsting88/relayAPI/main/README.md',
      { timeoutMs: 15000 }
    );

    const tables = parseMarkdownTable(md);
    if (tables.length === 0) {
      const links = extractMarkdownLinks(md);
      const stations = links
        .filter(l => /api|relay|proxy|中转|代理/i.test(l.text) || /https?:\/\/api\./.test(l.url))
        .map(l => ({ name: l.text, url: l.url }));
      console.log(`[parseRelayAPIGitHub] ${stations.length} stations from links`);
      return { discoveredStations: stations };
    }

    const stations = tables.map(row => {
      const name = row['名称'] || row['name'] || row['服务商'] || row['站点'] || '';
      let url = row['网址'] || row['url'] || row['链接'] || row['网站'] || '';
      const lm = url.match(/\[.*?\]\((.*?)\)/);
      if (lm) url = lm[1];
      if (!url) {
        for (const val of Object.values(row)) {
          if (typeof val === 'string' && /^https?:\/\//.test(val)) { url = val; break; }
        }
      }
      return { name, url, notes: row['备注'] || row['notes'] };
    }).filter(s => s.name && s.url);

    console.log(`[parseRelayAPIGitHub] ${stations.length} stations from table`);
    return { discoveredStations: stations };
  } catch (err: any) {
    console.error('[parseRelayAPIGitHub] Failed:', err.message);
    return null;
  }
}

/** Generic GitHub awesome-list parser */
export async function parseAwesomeList(readmeUrl: string): Promise<ParsedDiscoveryResult | null> {
  try {
    const md = await fetchHtml(readmeUrl, { timeoutMs: 15000 });
    const links = extractMarkdownLinks(md);
    const kw = /api|relay|proxy|中转|代理|openai|claude|gpt/i;
    const stations = links
      .filter(l => kw.test(l.text) || kw.test(l.url))
      .map(l => ({ name: l.text.replace(/[*`]/g, '').trim(), url: l.url }))
      .filter(s => s.name.length > 2 && s.url.startsWith('http'));

    console.log(`[parseAwesomeList] ${stations.length} stations`);
    return { discoveredStations: stations };
  } catch (err: any) {
    console.error('[parseAwesomeList] Failed:', err.message);
    return null;
  }
}

// ========== Price Comparison ==========

/** Parse hvoy.ai — real-time price comparison */
export async function parseHvoyAi(): Promise<ParsedDiscoveryResult | null> {
  try {
    const html = await fetchHtml('https://hvoy.ai', { timeoutMs: 20000 });

    // Try __NEXT_DATA__
    const nd = extractJsonFromHtml<any>(
      html, /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    if (nd?.props?.pageProps) {
      const arr = nd.props.pageProps.stations || nd.props.pageProps.channels || nd.props.pageProps.data;
      if (Array.isArray(arr)) {
        const stations = arr.map((s: any) => ({
          name: s.name || s.title || s.id,
          url: s.url || s.link || `https://${s.domain}`,
          notes: s.pricePercent ? `${s.pricePercent}% of official` : undefined,
        }));
        console.log(`[parseHvoyAi] ${stations.length} stations from __NEXT_DATA__`);
        return { discoveredStations: stations };
      }
    }

    // Fallback: HTML links
    const links = extractMarkdownLinks(html);
    const stations = links
      .filter(l => /api|relay|\.ai|\.io|\.com/i.test(l.url))
      .map(l => ({ name: l.text, url: l.url }))
      .slice(0, 50);

    console.log(`[parseHvoyAi] ${stations.length} stations from HTML`);
    return { discoveredStations: stations };
  } catch (err: any) {
    console.error('[parseHvoyAi] Failed:', err.message);
    return null;
  }
}

// ========== Coordinator ==========

/** Relay stations accessible without auth */
const RELAY_ENDPOINTS = [
  { url: 'https://api.together.xyz/v1/models', id: 'together-ai', name: 'Together AI' },
  { url: 'https://api.packycodes.com/v1/models', id: 'packycode', name: 'PackyCode' },
  { url: 'https://4sapi.com/v1/models', id: '4sapi', name: '4SAPI' },
  { url: 'https://api.147api.com/v1/models', id: '147api', name: '147API' },
  { url: 'https://api.apiyi.com/v1/models', id: 'apiyi', name: 'API易' },
  { url: 'https://api.aihubmix.com/v1/models', id: 'aihubmix', name: 'AIHubMix' },
  { url: 'https://api.laozhang.ai/v1/models', id: 'laozhang-ai', name: '老张API' },
  { url: 'https://api.ohmygpt.com/v1/models', id: 'ohmygpt', name: 'OhMyGPT' },
  { url: 'https://api.linkapi.pro/v1/models', id: 'linkapi', name: 'LinkAPI' },
  { url: 'https://api.cubence.com/v1/models', id: 'cubence', name: 'Cubence' },
  { url: 'https://api.i7relay.com/v1/models', id: 'i7relay', name: 'i7Relay' },
];

/** Run all parsers */
export async function parseAllSources(): Promise<{
  channels: ParsedChannelData[];
  discoveries: ParsedDiscoveryResult[];
}> {
  const channels: ParsedChannelData[] = [];
  const discoveries: ParsedDiscoveryResult[] = [];

  // OpenRouter (special parser with pricing)
  const or = await parseOpenRouter();
  if (or) channels.push(or);

  // Generic relay stations
  for (const r of RELAY_ENDPOINTS) {
    const result = await parseRelayModels(r.url, r.id, r.name);
    if (result) channels.push(result);
  }

  // Discovery
  const ra = await parseRelayAPIGitHub();
  if (ra) discoveries.push(ra);

  const a1 = await parseAwesomeList('https://raw.githubusercontent.com/newaiproxy/awesome-ai-proxy/main/README.md');
  if (a1) discoveries.push(a1);

  const a2 = await parseAwesomeList('https://raw.githubusercontent.com/whataicc/ai-proxy/main/README.md');
  if (a2) discoveries.push(a2);

  // Price comparison
  const hv = await parseHvoyAi();
  if (hv) discoveries.push(hv);

  console.log(`[parseAllSources] ${channels.length} channels, ${discoveries.length} discovery results`);
  return { channels, discoveries };
}

// ========== Utility Functions ==========

/** Per-1K price string → per-1M number */
function parsePriceToPer1M(price: string | null | undefined): number {
  if (!price || price === '0' || price === '') return 0;
  const num = parseFloat(price);
  return isNaN(num) ? 0 : num * 1000;
}

/** Infer model category from id/name */
function guessCategory(id: string, name?: string): string {
  const t = `${id} ${name || ''}`.toLowerCase();
  if (/whisper|tts|audio|speech/.test(t)) return 'audio';
  if (/dall-e|flux|stable.diffusion|image|sdxl|ideogram/.test(t)) return 'image';
  if (/embed|e5|bge|gte/.test(t)) return 'embedding';
  if (/codestral|code-|coder|deepseek-coder/.test(t)) return 'code';
  if (/reason|think|o1-|o3-|deepseek-r/.test(t)) return 'reasoning';
  if (/vision|vl-|qwen-vl|llava/.test(t)) return 'vision';
  return 'chat';
}
