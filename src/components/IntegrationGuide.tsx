"use client";

import { Channel, ChannelType } from "@/types";

const typeLabels: Record<ChannelType, string> = {
  relay: "中转站",
  proxy: "Token代理",
  "free-model": "免费模型",
  direct: "官方直连",
  hosting: "托管服务",
};

const typeQuickSteps: Record<ChannelType, string[]> = {
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
  const steps = typeQuickSteps[channel.type];
  const guideUrl = channel.docUrl || channel.url;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🚀</span>
        <h2 className="text-lg font-semibold text-foreground">
          接入助手 · {typeLabels[channel.type]}
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
        <p className="text-xs text-muted mb-2">替换 Base URL 即可接入：</p>
        <pre className="text-sm text-[#7ee787] font-mono">
{`# 原始 OpenAI 地址
https://api.openai.com/v1

# 替换为 ${channel.name}
${channel.url}${channel.url.endsWith('/') ? '' : '/'}v1`}
        </pre>
      </div>

      {/* Python example */}
      <div className="rounded-xl bg-[#0d1117] p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-muted mb-2">Python 示例：</p>
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
        📖 查看 {channel.name} 官方接入文档 ↗
      </a>
    </div>
  );
}
