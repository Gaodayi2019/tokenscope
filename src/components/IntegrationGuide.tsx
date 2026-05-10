"use client";

import { Channel, ChannelType } from "@/types";
import { useI18n } from "@/i18n/context";

const typeQuickStepsEn: Record<ChannelType, string[]> = {
  relay: [
    "1️⃣ Sign up and get your API Key",
    "2️⃣ Replace the API Base URL with the relay address",
    "3️⃣ Add your API Key to the request header",
    "4️⃣ Model names match OpenAI — just call directly",
  ],
  proxy: [
    "1️⃣ Purchase or get Token credits",
    "2️⃣ Use the provided API Key to replace the original",
    "3️⃣ Base URL may differ from official — follow docs",
    "4️⃣ Compatible with OpenAI SDK format",
  ],
  "free-model": [
    "1️⃣ Sign up for the platform",
    "2️⃣ Get a free API Key from the console",
    "3️⃣ Configure Base URL and model name per docs",
    "4️⃣ Note free quota and rate limits",
  ],
  direct: [
    "1️⃣ Register with the official provider (ID verification may be required)",
    "2️⃣ Enable API service and get your Key",
    "3️⃣ Use official SDK or OpenAI-compatible format",
    "4️⃣ Some models require official SDK — not OpenAI-compatible",
  ],
  hosting: [
    "1️⃣ Sign up for the platform",
    "2️⃣ Choose a model to deploy",
    "3️⃣ Get the Endpoint URL after deployment",
    "4️⃣ Call via REST API or SDK",
  ],
};

const typeQuickStepsZh: Record<ChannelType, string[]> = {
  relay: [
    "1️⃣ 注册账号并获取 API Key",
    "2️⃣ 将 API Base URL 替换为中转站地址",
    "3️⃣ 在请求头中填入你的 API Key",
    "4️⃣ 模型名称与 OpenAI 保持一致，直接调用",
  ],
  proxy: [
    "1️⃣ 购买/获取 Token 额度",
    "2️⃣ 使用提供的 API Key 替换原 Key",
    "3️⃣ Base URL 可能与官方相同或不同，按文档配置",
    "4️⃣ 调用方式与 OpenAI SDK 兼容",
  ],
  "free-model": [
    "1️⃣ 注册平台账号",
    "2️⃣ 在控制台获取免费 API Key",
    "3️⃣ 按文档配置 Base URL 和模型名",
    "4️⃣ 注意免费额度和速率限制",
  ],
  direct: [
    "1️⃣ 注册官方账号并实名认证（如需）",
    "2️⃣ 开通 API 服务，获取 Key",
    "3️⃣ 按官方 SDK 或 OpenAI 兼容方式调用",
    "4️⃣ 部分模型需使用官方 SDK，不兼容 OpenAI 格式",
  ],
  hosting: [
    "1️⃣ 注册平台账号",
    "2️⃣ 选择要部署的模型",
    "3️⃣ 部署完成后获取 Endpoint URL",
    "4️⃣ 按 REST API 或 SDK 方式调用",
  ],
};

interface IntegrationGuideProps {
  channel: Channel;
}

export function IntegrationGuide({ channel }: IntegrationGuideProps) {
  const { locale, t } = useI18n();
  const steps = locale === "zh" ? typeQuickStepsZh[channel.type] : typeQuickStepsEn[channel.type];
  const guideUrl = channel.docUrl || channel.url;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🚀</span>
        <h2 className="text-lg font-semibold text-foreground">
          {locale === "zh" ? "接入助手" : "Integration Guide"} · {t.badge[channel.type as keyof typeof t.badge]}
        </h2>
      </div>

      {/* Quick Steps */}
      <div className="space-y-2 mb-5">
        {steps.map((step, i) => (
          <div key={i} className="text-sm text-foreground leading-relaxed">{step}</div>
        ))}
      </div>

      {/* Code snippet: base URL swap */}
      <div className="rounded-xl bg-[#0d1117] p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-muted mb-2">{locale === "zh" ? "替换 Base URL 即可接入：" : "Replace Base URL to integrate:"}</p>
        <pre className="text-sm text-[#7ee787] font-mono">
{`# 原始 OpenAI 地址
https://api.openai.com/v1

# 替换为 ${channel.name}
${channel.url}${channel.url.endsWith('/') ? '' : '/'}v1`}
        </pre>
      </div>

      {/* Python example */}
      <div className="rounded-xl bg-[#0d1117] p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-muted mb-2">{locale === "zh" ? "Python 示例：" : "Python example:"}</p>
        <pre className="text-sm text-[#7ee787] font-mono">
{`from openai import OpenAI

client = OpenAI(
    api_key="你的API Key",
    base_url="${channel.url}${channel.url.endsWith('/') ? '' : '/'}v1"
)

response = client.chat.completions.create(
    model="模型名称",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
        </pre>
      </div>

      {/* Official guide link */}
      <a
        href={guideUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        📖 {locale === "zh" ? "查看" : "View"} {channel.name} {locale === "zh" ? "官方接入文档" : "Official Docs"} ↗
      </a>
    </div>
  );
}
