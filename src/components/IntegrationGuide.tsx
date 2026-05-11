"use client";

import { Channel, ChannelType } from "@/types";
import { useI18n } from "@/i18n/context";

const stepKeys: Record<ChannelType, string> = {
  relay: "stepRelay",
  proxy: "stepProxy",
  "free-model": "stepFree",
  direct: "stepDirect",
  hosting: "stepHosting",
};

interface IntegrationGuideProps {
  channel: Channel;
}

export function IntegrationGuide({ channel }: IntegrationGuideProps) {
  const { locale, t } = useI18n();
  const stepKey = stepKeys[channel.type] as keyof typeof t.integration;
  const steps = (t.integration[stepKey] as unknown) as string[];
  const guideUrl = channel.docUrl || channel.url;

  const baseUrl = `${channel.url}${channel.url.endsWith('/') ? '' : '/'}v1`;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🚀</span>
        <h2 className="text-lg font-semibold text-foreground">
          {t.integration.title} · {t.badge[channel.type as keyof typeof t.badge]}
        </h2>
      </div>

      {/* Quick Steps */}
      <div className="space-y-2 mb-5">
        {steps.map((step, i) => (
          <div key={i} className="text-sm text-foreground leading-relaxed">{i + 1}️⃣ {step}</div>
        ))}
      </div>

      {/* Code snippet: base URL swap */}
      <div className="rounded-xl bg-[#0d1117] p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-muted mb-2">{t.integration.replaceUrl}</p>
        <pre className="text-sm text-[#7ee787] font-mono">
{`# ${t.integration.codeCommentOriginal}\nhttps://api.openai.com/v1\n\n# ${t.integration.codeCommentReplace} ${channel.name}\n${baseUrl}`}
        </pre>
      </div>

      {/* Python example */}
      <div className="rounded-xl bg-[#0d1117] p-4 mb-5 overflow-x-auto">
        <p className="text-xs text-muted mb-2">{t.integration.pythonExample}</p>
        <pre className="text-sm text-[#7ee787] font-mono">
{`from openai import OpenAI

client = OpenAI(
    api_key="${t.integration.codeApiKey}",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="${t.integration.codeModelName}",
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
        📖 {t.integration.viewDocs} {channel.name} {t.integration.officialDocs} ↗
      </a>
    </div>
  );
}
