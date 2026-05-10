"use client";

import { useState } from "react";
import type { Channel, ChannelType, ChannelRatings } from "@/types";
import { ChannelTypeBadge } from "./ChannelTypeBadge";
import { useI18n } from "@/i18n/context";

type SortKey = "overall" | "stability" | "speed" | "value" | "price";

const sortIcons: Record<SortKey, string> = {
  overall:   "🏆",
  stability: "🛡️",
  speed:     "⚡",
  value:     "💰",
  price:     "🏷️",
};

const sortKeyMap: Record<SortKey, "overall" | "stability" | "speed" | "value" | "price"> = {
  overall:   "overall",
  stability: "stability",
  speed:     "speed",
  value:     "value",
  price:     "price",
};

const typeIcons: Record<ChannelType | "all", string> = {
  all:        "🌍",
  "free-model": "🎁",
  direct:     "⚡",
  relay:      "🔄",
  proxy:      "🎫",
  hosting:    "☁️",
};

const typeKeyMap: Record<ChannelType | "all", "all" | "free-model" | "direct" | "relay" | "proxy" | "hosting"> = {
  all:        "all",
  "free-model": "free-model",
  direct:     "direct",
  relay:      "relay",
  proxy:      "proxy",
  hosting:    "hosting",
};

function getLowestPrice(ch: Channel): number {
  const prices = ch.models
    .filter((m) => m.inputPricePer1M != null)
    .map((m) => m.inputPricePer1M!);
  return prices.length ? Math.min(...prices) : Infinity;
}

function getScore(ch: Channel, key: SortKey): number {
  if (key === "price") return -getLowestPrice(ch); // lower price = higher rank
  return ch.ratings[key as keyof ChannelRatings] as number;
}

function ScoreBar({ value, max = 5, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-surface">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const medalColors = [
  "text-yellow-400",  // 🥇
  "text-gray-300",    // 🥈
  "text-amber-600",   // 🥉
];

export function RankingBoard({ channels }: { channels: Channel[] }) {
  const { locale, t } = useI18n();
  const [activeType, setActiveType] = useState<ChannelType | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("overall");

  const filtered =
    activeType === "all"
      ? channels
      : channels.filter((c) => c.type === activeType);

  const sorted = [...filtered]
    .sort((a, b) => getScore(b, sortBy) - getScore(a, sortBy))
    .slice(0, 10);

  return (
    <div>
      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(typeKeyMap) as (ChannelType | "all")[]).map((type) => {
          const isActive = activeType === type;
          const label = t.ranking[typeKeyMap[type]];
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span>{typeIcons[type]}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(sortIcons) as SortKey[]).map((key) => {
          const isActive = sortBy === key;
          return (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              <span>{sortIcons[key]}</span>
              <span>{t.ranking[sortKeyMap[key]]}</span>
            </button>
          );
        })}
      </div>

      {/* Ranking List */}
      <div className="mt-5 space-y-2">
        {sorted.map((ch, idx) => {
          const score = getScore(ch, sortBy);
          const lowest = getLowestPrice(ch);
          return (
            <a
              key={ch.id}
              href={`/channel/${ch.id}`}
              className="group flex items-center gap-4 rounded-xl border border-card-border bg-card-bg p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              {/* Rank */}
              <div className={`w-8 text-center text-lg font-bold ${idx < 3 ? medalColors[idx] : "text-muted"}`}>
                {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : `${idx + 1}`}
              </div>

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                {ch.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {ch.name}
                  </span>
                  <ChannelTypeBadge type={ch.type} />
                  {ch.freeTier?.available && (
                    <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">{t.card.free}</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-muted">
                  <span>{t.card.latency} {ch.stats.avgLatency}ms</span>
                  <span>{t.card.uptime} {ch.stats.uptime30d}%</span>
                  {lowest !== Infinity && (
                    <span>最低 ${lowest.toFixed(2)}/1M</span>
                  )}
                  {ch.freeTier?.available && (
                    <span className="text-success">{locale === "zh" ? ch.freeTier.description : (ch.freeTier as any).descriptionEn || ch.freeTier.description}</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="shrink-0 w-28">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted">{t.ranking[sortKeyMap[sortBy]]}</span>
                  <span className="text-lg font-bold text-foreground">
                    {sortBy === "price"
                      ? lowest === Infinity
                        ? "—"
                        : `$${lowest.toFixed(2)}`
                      : score.toFixed(1)}
                  </span>
                </div>
                <ScoreBar
                  value={sortBy === "price" ? (lowest === Infinity ? 0 : Math.max(0, 5 - lowest)) : score}
                  color={
                    sortBy === "stability" ? "bg-success" :
                    sortBy === "speed"     ? "bg-accent" :
                    sortBy === "value"     ? "bg-warning" :
                    sortBy === "price"     ? "bg-green-400" :
                    "bg-primary"
                  }
                />
              </div>

              {/* Sub-scores (compact) */}
              <div className="hidden lg:flex shrink-0 gap-3">
                {(["stability", "speed", "value"] as const).map((k) => (
                  <div key={k} className="w-16 text-center">
                    <div className="text-[10px] text-muted">{t.ranking[k as keyof typeof t.ranking]}</div>
                    <div className="text-sm font-semibold text-foreground">{ch.ratings[k].toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </a>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-12 text-center text-muted">
            {t.card.noData}
          </div>
        )}
      </div>
    </div>
  );
}
