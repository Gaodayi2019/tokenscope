"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChannelCard } from "@/components/ChannelCard";
import { ChannelTypeBadge } from "@/components/ChannelTypeBadge";
import { SubmitChannelModal } from "@/components/SubmitChannelModal";
import { useI18n } from "@/i18n/context";
import { useChannels } from "@/lib/useData";
import { channels as staticChannels } from "@/data/channels";
import type { ChannelType, Region, PaymentMethod, Channel } from "@/types";

type SortKey = "rating" | "price-low" | "latency" | "reviews" | "newest";

function getLowestPrice(ch: Channel): number {
  const prices = ch.models.filter((m) => m.inputPricePer1M != null).map((m) => m.inputPricePer1M!);
  return prices.length ? Math.min(...prices) : Infinity;
}

function sortChannels(list: Channel[], key: SortKey): Channel[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case "rating":     return b.ratings.overall - a.ratings.overall;
      case "price-low":  return getLowestPrice(a) - getLowestPrice(b);
      case "latency":    return a.stats.avgLatency - b.stats.avgLatency;
      case "reviews":    return b.stats.reviewCount - a.stats.reviewCount;
      case "newest":     return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:           return 0;
    }
  });
}

export default function ChannelsPage() {
  const { locale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ChannelType | "all">("all");
  const [activeRegion, setActiveRegion] = useState<Region | "all">("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [submitOpen, setSubmitOpen] = useState(false);

  const { channels: filtered, loading } = useChannels({
    type: activeType !== "all" ? activeType : undefined,
    region: activeRegion !== "all" ? activeRegion : undefined,
    freeOnly,
    search: search || undefined,
    sortBy,
  });

  const typeFilters: { type: ChannelType | "all"; label: string; icon: string }[] = [
    { type: "all",        label: t.channels.all,        icon: "🌍" },
    { type: "free-model", label: t.channels.freeModels, icon: "🎁" },
    { type: "direct",     label: t.channels.direct,     icon: "⚡" },
    { type: "relay",      label: t.channels.relay,      icon: "🔄" },
    { type: "proxy",      label: t.channels.proxy,      icon: "🎫" },
    { type: "hosting",    label: t.channels.hosting,    icon: "☁️" },
  ];

  const regionFilters: { region: Region | "all"; label: string }[] = [
    { region: "all",    label: t.channels.all },
    { region: "cn",     label: locale === "zh" ? "🇨🇳 中国" : "🇨🇳 China" },
    { region: "us",     label: "🇺🇸 US" },
    { region: "eu",     label: "🇪🇺 EU" },
    { region: "asia",   label: "🌏 Asia" },
    { region: "global", label: "🌐 Global" },
  ];

  const sortOptions: { key: SortKey; label: string; icon: string }[] = [
    { key: "rating",    label: t.channels.sortByRating,  icon: "🏆" },
    { key: "price-low", label: t.channels.sortByPrice,   icon: "💰" },
    { key: "latency",   label: t.channels.sortByLatency, icon: "⚡" },
    { key: "reviews",   label: t.channels.sortByReviews, icon: "💬" },
    { key: "newest",    label: t.channels.sortByNewest,  icon: "🆕" },
  ];

  // filtered comes from useChannels hook now

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.channels.title}</h1>
              <p className="mt-1 text-muted">{t.channels.subtitle}</p>
            </div>
            <button onClick={() => setSubmitOpen(true)} className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              {t.channels.submitNew}
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.channels.search}
            className="w-full rounded-2xl border border-card-border bg-surface py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">✕</button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {typeFilters.map((tf) => {
            const isActive = activeType === tf.type;
            const count = tf.type === "all" ? staticChannels.length : staticChannels.filter((c) => c.type === tf.type).length;
            return (
              <button key={tf.type} onClick={() => setActiveType(tf.type)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"}`}>
                <span>{tf.icon}</span>
                <span>{tf.label}</span>
                <span className={`ml-0.5 text-xs ${isActive ? "text-white/70" : "text-muted-foreground"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setFreeOnly(!freeOnly)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${freeOnly ? "bg-success/15 text-success ring-1 ring-success/30" : "bg-surface text-muted hover:text-foreground"}`}>
            {t.channels.freeOnly}
          </button>
          <select value={activeRegion} onChange={(e) => setActiveRegion(e.target.value as Region | "all")}
            className="rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
            {regionFilters.map((rf) => <option key={rf.region} value={rf.region}>{rf.label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted">{t.channels.sort}</span>
            {sortOptions.map((opt) => (
              <button key={opt.key} onClick={() => setSortBy(opt.key)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${sortBy === opt.key ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "bg-surface text-muted hover:text-foreground"}`}>
                <span>{opt.icon}</span><span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            {t.channels.found} <span className="font-medium text-foreground">{filtered.length}</span> {t.channels.channelUnit}
          </p>
          {loading && <span className="text-xs text-muted animate-pulse">Loading...</span>}
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ch) => <ChannelCard key={ch.id} channel={ch} />)}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-foreground">{t.channels.noResults}</h3>
            <p className="mt-2 text-sm text-muted">{t.channels.noResultsHint}</p>
            <button onClick={() => { setSearch(""); setActiveType("all"); setActiveRegion("all"); setFreeOnly(false); }}
              className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              {t.channels.clearFilters}
            </button>
          </div>
        )}
      </main>
      <Footer />
      <SubmitChannelModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
