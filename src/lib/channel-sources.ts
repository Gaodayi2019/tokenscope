// ============================================================
// TokenScope — Channel Data Sources (Relay/Proxy Focus)
// ============================================================

export type SourceType =
  | "relay-api"
  | "community-list"
  | "price-comparison"
  | "official-api"
  | "official-pricing"
  | "station-directory";

export type FetchMethod =
  | "fetch-json"
  | "fetch-html"
  | "scrape-github";

export interface ChannelSource {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  fetchMethod: FetchMethod;
  channelId?: string;
  parser: string;
  enabled: boolean;
  timeoutMs?: number;
  notes?: string;
}

// ============================================================
// Relay/Proxy Stations
// ============================================================

export const RELAY_STATIONS: ChannelSource[] = [
  {
    id: "relay-openrouter",
    name: "OpenRouter",
    type: "official-api",
    url: "https://openrouter.ai/api/v1/models",
    fetchMethod: "fetch-json",
    channelId: "openrouter",
    parser: "parseOpenRouter",
    enabled: true,
    timeoutMs: 15000,
    notes: "Public JSON API, richest data source",
  },
  {
    id: "relay-together",
    name: "Together AI",
    type: "official-api",
    url: "https://api.together.xyz/v1/models",
    fetchMethod: "fetch-json",
    channelId: "together-ai",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
    notes: "Public /v1/models endpoint",
  },
  {
    id: "relay-packycode",
    name: "PackyCode",
    type: "relay-api",
    url: "https://api.packycodes.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "packycode",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
    notes: "New API backend",
  },
  {
    id: "relay-4sapi",
    name: "4SAPI",
    type: "relay-api",
    url: "https://4sapi.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "4sapi",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-147api",
    name: "147API",
    type: "relay-api",
    url: "https://api.147api.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "147api",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-apiyi",
    name: "API易",
    type: "relay-api",
    url: "https://api.apiyi.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "apiyi",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-aihubmix",
    name: "AIHubMix",
    type: "relay-api",
    url: "https://api.aihubmix.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "aihubmix",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-laozhang",
    name: "老张API",
    type: "relay-api",
    url: "https://api.laozhang.ai/v1/models",
    fetchMethod: "fetch-json",
    channelId: "laozhang-ai",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-ohmygpt",
    name: "OhMyGPT",
    type: "relay-api",
    url: "https://api.ohmygpt.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "ohmygpt",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-linkapi",
    name: "LinkAPI",
    type: "relay-api",
    url: "https://api.linkapi.pro/v1/models",
    fetchMethod: "fetch-json",
    channelId: "linkapi",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-cubence",
    name: "Cubence",
    type: "relay-api",
    url: "https://api.cubence.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "cubence",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-i7relay",
    name: "i7Relay",
    type: "relay-api",
    url: "https://api.i7relay.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "i7relay",
    parser: "parseRelayModels",
    enabled: true,
    timeoutMs: 10000,
  },
  {
    id: "relay-siliconflow",
    name: "SiliconFlow",
    type: "official-api",
    url: "https://api.siliconflow.cn/v1/models",
    fetchMethod: "fetch-json",
    channelId: "siliconflow",
    parser: "parseRelayModels",
    enabled: false,
    notes: "Requires API key (401)",
  },
  {
    id: "relay-deepseek",
    name: "DeepSeek (Official)",
    type: "official-api",
    url: "https://api.deepseek.com/v1/models",
    fetchMethod: "fetch-json",
    channelId: "deepseek-official",
    parser: "parseRelayModels",
    enabled: false,
    notes: "Requires API key",
  },
  {
    id: "relay-groq",
    name: "Groq (Official)",
    type: "official-api",
    url: "https://api.groq.com/openai/v1/models",
    fetchMethod: "fetch-json",
    channelId: "groq",
    parser: "parseRelayModels",
    enabled: false,
    notes: "Requires API key",
  },
];

// ============================================================
// Discovery Sources
// ============================================================

export const DISCOVERY_SOURCES: ChannelSource[] = [
  {
    id: "discover-relayapi",
    name: "relayAPI GitHub",
    type: "community-list",
    url: "https://raw.githubusercontent.com/zzsting88/relayAPI/main/README.md",
    fetchMethod: "scrape-github",
    parser: "parseRelayAPIGitHub",
    enabled: true,
    timeoutMs: 15000,
    notes: "30+ relay stations with reviews",
  },
  {
    id: "discover-awesome-proxy",
    name: "Awesome AI Proxy",
    type: "community-list",
    url: "https://raw.githubusercontent.com/newaiproxy/awesome-ai-proxy/main/README.md",
    fetchMethod: "scrape-github",
    parser: "parseAwesomeList",
    enabled: true,
    timeoutMs: 15000,
  },
  {
    id: "discover-whataicc",
    name: "AI Proxy (whataicc)",
    type: "community-list",
    url: "https://raw.githubusercontent.com/whataicc/ai-proxy/main/README.md",
    fetchMethod: "scrape-github",
    parser: "parseAwesomeList",
    enabled: true,
    timeoutMs: 15000,
  },
];

// ============================================================
// Price Comparison
// ============================================================

export const PRICE_COMPARISON_SOURCES: ChannelSource[] = [
  {
    id: "price-hvoy",
    name: "hvoy.ai",
    type: "price-comparison",
    url: "https://hvoy.ai",
    fetchMethod: "fetch-html",
    parser: "parseHvoyAi",
    enabled: true,
    timeoutMs: 20000,
    notes: "Real-time price comparison + dilution detection",
  },
];

// ============================================================
// Combined & Helpers
// ============================================================

export const ALL_SOURCES: ChannelSource[] = [
  ...RELAY_STATIONS,
  ...DISCOVERY_SOURCES,
  ...PRICE_COMPARISON_SOURCES,
];

export function getActiveSources(): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.enabled);
}

export function getRelaySources(): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.type === "relay-api" && s.enabled);
}

export function getDiscoverySources(): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.type === "community-list" && s.enabled);
}

export function getPriceComparisonSources(): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.type === "price-comparison" && s.enabled);
}

export function getSourcesForChannel(channelId: string): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.channelId === channelId);
}

export function getSourcesByType(type: SourceType): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.type === type);
}

export function getSourcesByFetchMethod(method: FetchMethod): ChannelSource[] {
  return ALL_SOURCES.filter((s) => s.fetchMethod === method);
}

export function getApiBaseUrl(source: ChannelSource): string {
  return source.url.replace(/\/v1\/models\/?$/, "").replace(/\/v1\/?$/, "");
}
