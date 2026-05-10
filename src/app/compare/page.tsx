"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarRating } from "@/components/StarRating";
import { useChannels } from "@/lib/useData";
import { channels as staticChannels } from "@/data/channels";
import { useI18n } from "@/i18n/context";

type Metric = "overall" | "stability" | "speed" | "service" | "value";

function CompareContent() {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  const [selectedIds, setSelectedIds] = useState<string[]>(preselected.length ? preselected : []);
  const [showPicker, setShowPicker] = useState(preselected.length === 0);

  const { channels } = useChannels();
  const allChannels = channels.length > 0 ? channels : staticChannels;
  const selected = useMemo(() => allChannels.filter((c) => selectedIds.includes(c.id)), [selectedIds, allChannels]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  function Bar({ value, max = 5 }: { value: number; max?: number }) {
    const pct = (value / max) * 100;
    return (
      <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">📊 {t.compare.title}</h1>
          <p className="mt-1 text-muted">{t.compare.subtitle}</p>
        </div>

        {/* Picker */}
        <div className="mb-6 rounded-2xl border border-card-border bg-card-bg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">{t.compare.selectChannels}</h2>
            <button onClick={() => setShowPicker(!showPicker)} className="text-sm text-primary hover:underline">
              {showPicker ? (locale === "zh" ? "收起" : "Collapse") : (locale === "zh" ? "展开" : "Expand")}
            </button>
          </div>
          {showPicker && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allChannels.map((ch) => {
                const active = selectedIds.includes(ch.id);
                const full = selectedIds.length >= 4 && !active;
                return (
                  <button key={ch.id} onClick={() => !full && toggle(ch.id)} disabled={full}
                    className={`rounded-xl px-3 py-2 text-sm font-medium text-left transition-all ${
                      active ? "bg-primary text-white ring-2 ring-primary/30" :
                      full ? "bg-surface text-muted-foreground cursor-not-allowed opacity-50" :
                      "bg-surface text-foreground hover:bg-surface-hover"
                    }`}>
                    {ch.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected.length < 2 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-muted">{t.compare.pick}</p>
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-card-border bg-card-bg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="p-4 text-left font-medium text-muted w-32">{t.compare.metric}</th>
                    {selected.map((ch) => (
                      <th key={ch.id} className="p-4 text-left font-semibold text-foreground">
                        <a href={`/channel/${ch.id}`} className="hover:text-primary transition-colors">{ch.name}</a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Type & Status */}
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.type}</td>
                    {selected.map((ch) => <td key={ch.id} className="p-4 text-foreground">{ch.type}</td>)}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.status}</td>
                    {selected.map((ch) => <td key={ch.id} className="p-4 text-foreground">{ch.status}</td>)}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.latency}</td>
                    {selected.map((ch) => <td key={ch.id} className="p-4 text-foreground">{ch.stats.avgLatency}ms</td>)}
                  </tr>
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.availability}</td>
                    {selected.map((ch) => <td key={ch.id} className="p-4 text-foreground">{ch.stats.uptime30d}%</td>)}
                  </tr>
                  {/* Rating bars */}
                  {(Object.entries({overall: t.compare.overall, stability: t.channel.stability, speed: t.channel.speed, service: t.channel.service, value: t.channel.value}) as [string, string][]).map(([key, label]) => (
                    <tr key={key} className="border-b border-card-border/50 last:border-0">
                      <td className="p-4 text-muted">{label}</td>
                      {selected.map((ch) => {
                        const val = (ch.ratings as any)[key];
                        return (
                          <td key={ch.id} className="p-4">
                            <div className="flex items-center gap-2">
                              <Bar value={val} />
                              <span className="shrink-0 text-foreground font-medium">{val.toFixed(1)}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Model count */}
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.modelCount}</td>
                    {selected.map((ch) => <td key={ch.id} className="p-4 text-foreground">{ch.models.length}</td>)}
                  </tr>
                  {/* Free tier */}
                  <tr className="border-b border-card-border/50">
                    <td className="p-4 text-muted">{t.compare.freeTier}</td>
                    {selected.map((ch) => (
                      <td key={ch.id} className="p-4">
                        {ch.freeTier?.available
                          ? <span className="text-success font-medium">🎁 {ch.freeTier.description}</span>
                          : <span className="text-muted-foreground">{t.compare.none}</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Payment */}
                  <tr>
                    <td className="p-4 text-muted">{t.compare.payment}</td>
                    {selected.map((ch) => (
                      <td key={ch.id} className="p-4 text-foreground">{ch.paymentMethods.join("、")}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap gap-3">
              {selected.map((ch) => (
                <a key={ch.id} href={`/channel/${ch.id}`} className="rounded-xl bg-surface px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors">
                  {ch.name} {t.compare.detail}
                </a>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
