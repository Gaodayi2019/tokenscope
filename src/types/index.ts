// ============================================================
// TokenScope - Data Type Definitions
// All channel types: Relay, Proxy, Free Model, Direct, Hosting
// ============================================================

/** Channel type classification */
export type ChannelType =
  | "relay"        // API 中转站/代理站
  | "proxy"        // Token 代理/经销商
  | "free-model"   // 大厂免费模型
  | "direct"       // 国产低价模型直连
  | "hosting";     // 开源模型托管服务

/** Channel status */
export type ChannelStatus = "online" | "offline" | "unstable" | "unknown";

/** Certification level */
export type CertLevel = "none" | "verified" | "premium";

/** Supported model categories */
export type ModelCategory =
  | "chat"         // 对话模型
  | "code"         // 代码模型
  | "vision"       // 多模态/视觉
  | "embedding"    // 嵌入模型
  | "image"        // 图像生成
  | "audio"        // 语音模型
  | "reasoning";   // 推理模型

/** Model info within a channel */
export interface ModelInfo {
  id: string;
  name: string;
  category: ModelCategory;
  inputPricePer1M?: number;   // USD per 1M input tokens
  outputPricePer1M?: number;  // USD per 1M output tokens
  isFree?: boolean;
  freeQuota?: string;         // e.g. "1000 requests/day"
  contextWindow?: number;     // max tokens
}

/** Channel ratings */
export interface ChannelRatings {
  overall: number;     // 0-5
  stability: number;   // 0-5
  speed: number;       // 0-5
  service: number;     // 0-5
  value: number;       // 0-5 (性价比)
  count: number;       // number of reviews
}

/** Channel statistics */
export interface ChannelStats {
  avgLatency: number;      // ms
  uptime30d: number;       // percentage 0-100
  reviewCount: number;
  monthlyActiveUsers?: number;
}

/** Payment method */
export type PaymentMethod =
  | "alipay" | "wechat" | "credit-card" | "crypto"
  | "paypal" | "bank-transfer" | "free";

/** Region */
export type Region =
  | "cn" | "us" | "eu" | "asia" | "global";

/** Main Channel data model */
export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  descriptionEn: string;
  url: string;
  docUrl?: string;
  status: ChannelStatus;
  certLevel: CertLevel;
  region: Region[];
  tags: string[];
  tagsEn: string[];

  // Models & pricing
  models: ModelInfo[];

  // Payment
  paymentMethods: PaymentMethod[];

  // Ratings & stats
  ratings: ChannelRatings;
  stats: ChannelStats;

  // Free tier info
  freeTier?: {
    available: boolean;
    description: string;     // e.g. "每天100次免费调用"
    descriptionEn: string;   // e.g. "100 free calls/day"
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

/** User review */
export interface Review {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
  ratings: {
    stability: number;
    speed: number;
    service: number;
    value: number;
  };
  content: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
}

/** Search / filter parameters */
export interface SearchParams {
  query?: string;
  type?: ChannelType;
  model?: string;
  region?: Region;
  payment?: PaymentMethod;
  freeOnly?: boolean;
  sortBy?: "rating" | "price" | "latency" | "reviews" | "newest";
  page?: number;
  pageSize?: number;
}
