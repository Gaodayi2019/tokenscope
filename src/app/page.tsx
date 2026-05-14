"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChannelCard } from "@/components/ChannelCard";
import { RankingBoard } from "@/components/RankingBoard";
import { useI18n } from "@/i18n/context";
import { useSiteStats, useChannels } from "@/lib/useData";

export default function HomePage() {
  const { t, locale } = useI18n();
  const { stats } = useSiteStats();
  const { channels } = useChannels(); // dynamic data from API
  const [searchQuery, setSearchQuery] = useState("");

  // Derive all lists from dynamic data
  const featuredChannels = useMemo(
    () =>
      channels
        .filter((c) => c.featured)
        .concat(
          // If no featured flag, pick top-rated channels
          channels
            .filter((c) => !c.featured && c.ratings?.overall)
            .sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0))
        )
        .slice(0, 6),
    [channels]
  );

  const freeChannels = useMemo(
    () =>
      channels.filter(
        (c) => c.type === "free-model" || c.freeTier?.available
      ).slice(0, 6),
    [channels]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/channels?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <Header />
      <main>
        {/* ========== Hero ========== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t.hero.title1}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t.hero.title2}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
                {t.hero.subtitle}
              </p>

              <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.hero.search}
                    className="w-full rounded-2xl border border-card-border bg-surface py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </form>

              <div className="mx-auto mt-10 flex max-w-lg justify-center gap-8 sm:gap-12">
                {[
                  { value: stats.channels, label: t.stats.channels },
                  { value: stats.models, label: t.stats.models },
                  { value: stats.reviews, label: t.stats.reviews },
                  { value: stats.users, label: t.stats.users },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-foreground sm:text-3xl">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== Free Models Banner ========== */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  <h2 className="text-xl font-bold text-foreground">{t.home.freeBanner}</h2>
                </div>
                <p className="mt-1 text-sm text-muted">{t.home.freeBannerDesc}</p>
              </div>
              <a href="/free" className="shrink-0 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90">
                {t.home.viewAll}
              </a>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freeChannels.slice(0, 3).map((ch) => (
                <a key={ch.id} href={`/channel/${ch.id}`} className="rounded-xl border border-card-border bg-card-bg p-4 transition-all hover:border-success/30">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success font-bold text-sm">
                      {ch.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{ch.name}</div>
                      <div className="text-xs text-success">{locale === "en" && ch.freeTier?.descriptionEn ? ch.freeTier.descriptionEn : (ch.freeTier?.description || t.home.freeLabel)}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Featured Channels ========== */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{t.home.featured}</h2>
            <a href="/channels" className="text-sm text-primary transition-colors hover:text-primary-light">
              {t.home.viewAll}
            </a>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        </section>

        {/* ========== Rankings ========== */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{t.home.rankings}</h2>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">{t.home.realtime}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{t.home.rankingsDesc}</p>
          <div className="mt-5">
            <RankingBoard channels={channels} />
          </div>
        </section>

        {/* ========== Quick Categories ========== */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{t.home.browseByCategory}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { type: t.home.catRelay, icon: "🔄", desc: t.home.catRelayDesc, color: "from-purple-500/10 to-purple-500/5", filterType: "relay" },
              { type: t.home.catProxy, icon: "🎫", desc: t.home.catProxyDesc, color: "from-blue-500/10 to-blue-500/5", filterType: "proxy" },
              { type: t.home.catFree, icon: "🎁", desc: t.home.catFreeDesc, color: "from-green-500/10 to-green-500/5", filterType: "free-model" },
              { type: t.home.catDirect, icon: "⚡", desc: t.home.catDirectDesc, color: "from-cyan-500/10 to-cyan-500/5", filterType: "direct" },
              { type: t.home.catHosting, icon: "☁️", desc: t.home.catHostingDesc, color: "from-orange-500/10 to-orange-500/5", filterType: "hosting" },
            ].map((cat) => (
              <a
                key={cat.filterType}
                href={`/channels?type=${cat.filterType}`}
                className={`rounded-2xl border border-card-border bg-gradient-to-b ${cat.color} p-5 transition-all hover:border-primary/30 hover:shadow-md`}
              >
                <div className="text-3xl">{cat.icon}</div>
                <h3 className="mt-2 font-semibold text-foreground">{cat.type}</h3>
                <p className="mt-0.5 text-xs text-muted">{cat.desc}</p>
                <p className="mt-2 text-xs font-medium text-primary">{channels.filter(c => c.type === cat.filterType).length} {t.home.channelCount}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
