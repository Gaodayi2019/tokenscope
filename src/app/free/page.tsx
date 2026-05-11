"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarRating } from "@/components/StarRating";
import { useChannels } from "@/lib/useData";
import { channels as staticChannels } from "@/data/channels";
import { useI18n } from "@/i18n/context";

const categoryIcons: Record<string, string> = {
  chat: "💬", code: "💻", vision: "👁️", embedding: "📐", image: "🎨", audio: "🎤", reasoning: "🧠",
};

export default function FreePage() {
  const { locale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const { channels: dynamicChannels } = useChannels({ freeOnly: true });
  const channels = dynamicChannels.length > 0 ? dynamicChannels : staticChannels;

  const freeModels = useMemo(() => {
    const results: { chId: string; chName: string; chUrl: string; chType: string; model: any }[] = [];
    for (const ch of channels) {
      for (const m of ch.models) {
        if (m.isFree || ch.type === "free-model") {
          results.push({ chId: ch.id, chName: ch.name, chUrl: ch.url, chType: ch.type, model: m });
        }
      }
    }
    return results;
  }, []);

  const filtered = useMemo(() => {
    let list = freeModels;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.model.name.toLowerCase().includes(q) ||
          item.chName.toLowerCase().includes(q)
      );
    }
    if (catFilter !== "all") {
      list = list.filter((item) => item.model.category === catFilter);
    }
    return list;
  }, [freeModels, search, catFilter]);

  const categories = useMemo(() => {
    const cats = new Set(freeModels.map((i) => i.model.category));
    return Array.from(cats).sort();
  }, [freeModels]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">🎁 {t.free.title}</h1>
          <p className="mt-1 text-muted">{t.free.subtitle}</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="w-full rounded-2xl border border-card-border bg-surface py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setCatFilter("all")} className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${catFilter === "all" ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}>
            {t.guides.all} ({freeModels.length})
          </button>
          {categories.map((cat) => {
            const count = freeModels.filter((i) => i.model.category === cat).length;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${catFilter === cat ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}>
                {categoryIcons[cat] || "📦"} {cat} ({count})
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-sm text-muted">{t.free.found} <span className="font-medium text-foreground">{filtered.length}</span> {t.free.freeModelsUnit}</p>

        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, idx) => (
              <a key={`${item.chId}-${item.model.id}-${idx}`} href={`/channel/${item.chId}`} className="group block rounded-2xl border border-card-border bg-card-bg p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {categoryIcons[item.model.category] || "📦"} {item.model.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">via {item.chName}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">{t.free.free}</span>
                </div>
                {item.model.freeQuota && (
                  <p className="mt-2 text-sm text-muted">{t.free.quota}: {item.model.freeQuota}</p>
                )}
                {item.model.contextWindow && (
                  <p className="mt-1 text-xs text-muted-foreground">{t.free.contextWindow}: {(item.model.contextWindow / 1000).toFixed(0)}K</p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-lg font-semibold text-foreground">{t.free.noResults}</h3>
            <button onClick={() => { setSearch(""); setCatFilter("all"); }} className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm text-white hover:bg-primary/90">
              {t.free.clearFilters}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
