"use client";

import type { ChannelType } from "@/types";
import { useI18n } from "@/i18n/context";

const typeColor: Record<ChannelType, string> = {
  relay:      "bg-purple-500/20 text-purple-400",
  proxy:      "bg-blue-500/20 text-blue-400",
  "free-model": "bg-green-500/20 text-green-400",
  direct:     "bg-cyan-500/20 text-cyan-400",
  hosting:    "bg-orange-500/20 text-orange-400",
};

const typeKey: Record<ChannelType, string> = {
  relay:      "relay",
  proxy:      "proxy",
  "free-model": "free-model",
  direct:     "direct",
  hosting:    "hosting",
};

export function ChannelTypeBadge({ type }: { type: ChannelType }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[type]}`}>
      {t.badge[typeKey[type] as keyof typeof t.badge]}
    </span>
  );
}
