"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/i18n/context";

const guides = [
  {
    id: "what-is-relay",
    category: "入门",
    title: "什么是 API 中转站？",
    summary: "了解中转站的工作原理、适用场景和风险",
    content: `API 中转站（Relay）是介于开发者和大模型厂商之间的代理服务。你把请求发给中转站，中转站转发给 OpenAI/Claude/Google 等厂商，再把响应返回给你。

**为什么需要中转站？**
- 🌍 国内直连 OpenAI 等服务不稳定，中转站提供稳定线路
- 💰 部分中转站支持人民币支付，免去信用卡烦恼
- 🎁 很多中转站提供免费额度，方便试用
- 📦 一个 API Key 访问多个模型，简化管理

**潜在风险：**
- 数据经过第三方，需选择可信服务
- 中转站可能随时调整价格或下线
- 免费额度可能有限制或变更

**选择建议：** 优先选择有认证标记、运营时间长、用户评价好的中转站。TokenScope 的评分和评价系统可以帮助你筛选。`,
  },
  {
    id: "free-models",
    category: "入门",
    title: "免费模型完全指南",
    summary: "零成本接入 AI 的所有方式汇总",
    content: `**方式一：大厂免费模型**
- Google Gemini：免费额度充足，支持多模态
- 阿里通义千问：国内直连，免费额度慷慨
- 百度文心一言：基础模型免费使用
- 智谱 GLM：ChatGLM 系列有免费接口

**方式二：中转站免费额度**
- 多数中转站新用户送 $0.5-5 不等
- 部分中转站提供每日免费调用次数

**方式三：开源模型自部署**
- Ollama 本地运行 Llama、Qwen 等
- HuggingFace Spaces 免费体验
- Cloudflare Workers AI 免费额度

**最佳实践：**
1. 先用免费额度测试 API 兼容性
2. 小项目直接用免费模型即可
3. 生产环境建议搭配付费方案做 fallback`,
  },
  {
    id: "api-compatibility",
    category: "开发",
    title: "API 兼容性与迁移指南",
    summary: "OpenAI 格式统一标准，切换渠道只需改一行代码",
    content: `**好消息：** 大多数中转站和直连服务都兼容 OpenAI API 格式，迁移成本极低。

**只需改 base_url：**
\`\`\`python
# 原始 OpenAI
client = OpenAI(api_key="sk-xxx", base_url="https://api.openai.com/v1")

# 切换到中转站 — 只改 base_url 和 api_key
client = OpenAI(api_key="relay-key-xxx", base_url="https://relay.example.com/v1")
\`\`\`

**注意事项：**
- 部分模型名可能不同（如 gpt-4o → gpt4o）
- 流式响应格式可能略有差异
- Vision/Function Calling 等高级功能兼容性需确认
- 错误码和错误信息可能不同

**迁移检查清单：**
1. ✅ base_url 和 api_key 已更新
2. ✅ 模型名称已适配
3. ✅ 流式输出正常
4. ✅ 错误处理已覆盖
5. ✅ 超时设置已调整（中转站可能延迟更高）`,
  },
  {
    id: "price-compare",
    category: "省钱",
    title: "如何选择最划算的方案？",
    summary: "不同用量下的最优方案推荐",
    content: `**轻度用户（< 100万 token/月）：**
- 推荐免费模型为主（Gemini/通义千问）
- 中转站免费额度即可满足
- 月成本：¥0

**中度用户（100万-1000万 token/月）：**
- 中转站是性价比之选
- 对比直连价格，中转站通常便宜 30-60%
- 月成本：¥50-300

**重度用户（> 1000万 token/月）：**
- 直连 + 中转站混合方案
- 主力用直连保证稳定性，中转站做 fallback
- 考虑 Azure 等企业级方案
- 月成本：¥300+

**省钱技巧：**
1. 用 TokenScope 对比各渠道价格
2. 小模型做大模型的事（GPT-4o-mini 等）
3. 合理设置 max_tokens 避免浪费
4. 缓存重复请求结果
5. 批量请求替代逐条调用`,
  },
  {
    id: "security",
    category: "安全",
    title: "API Key 安全最佳实践",
    summary: "保护你的密钥和数据安全",
    content: `**基本规则：**
- ❌ 绝不在前端代码中暴露 API Key
- ❌ 绝不把 Key 提交到 Git 仓库
- ✅ 使用环境变量存储 Key
- ✅ 定期轮换 API Key
- ✅ 为不同项目使用不同 Key

**中转站特有风险：**
- 你的请求内容经过中转站服务器
- 选择支持不记录日志（no-log）的服务
- 敏感数据（医疗、法律等）建议直连
- 查看中转站的隐私政策和服务条款

**代码层面：**
\`\`\`bash
# .env.local（不要提交到 Git！）
OPENAI_API_KEY=sk-xxx
RELAY_API_KEY=relay-xxx
\`\`\`

\`\`\`gitignore
# .gitignore
.env.local
.env*.local
\`\`\`

**监控：**
- 定期检查 API 用量是否异常
- 设置预算上限防止意外消耗
- 启用两步验证保护账户`,
  },
];

const categories = ["全部", ...Array.from(new Set(guides.map((g) => g.category)))];

export default function GuidesPage() {
  const { t } = useI18n();
  const [activeCat, setActiveCat] = useState("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeCat === "全部" ? guides : guides.filter((g) => g.category === activeCat);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">📖 {t.guides.title}</h1>
          <p className="mt-1 text-muted">{t.guides.subtitle}</p>
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeCat === cat ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Guide list */}
        <div className="space-y-4">
          {filtered.map((guide) => {
            const isOpen = expandedId === guide.id;
            return (
              <div key={guide.id} className="rounded-2xl border border-card-border bg-card-bg overflow-hidden transition-all">
                <button onClick={() => setExpandedId(isOpen ? null : guide.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-3 hover:bg-surface-hover/30 transition-colors">
                  <div className="min-w-0">
                    <span className="inline-block rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mb-2">
                      {guide.category}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{guide.title}</h3>
                    <p className="mt-1 text-sm text-muted">{guide.summary}</p>
                  </div>
                  <span className="shrink-0 text-muted text-xl transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "" }}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="prose prose-invert prose-sm max-w-none text-muted leading-relaxed whitespace-pre-line border-t border-card-border pt-4">
                      {guide.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
