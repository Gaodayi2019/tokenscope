import type { ChannelType } from "@/types";

const typeConfig: Record<ChannelType, { label: string; color: string }> = {
  relay:      { label: "中转站",   color: "bg-purple-500/20 text-purple-400" },
  proxy:      { label: "Token代理", color: "bg-blue-500/20 text-blue-400" },
  "free-model": { label: "免费模型", color: "bg-green-500/20 text-green-400" },
  direct:     { label: "直连",     color: "bg-cyan-500/20 text-cyan-400" },
  hosting:    { label: "模型托管", color: "bg-orange-500/20 text-orange-400" },
};

export function ChannelTypeBadge({ type }: { type: ChannelType }) {
  const config = typeConfig[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
