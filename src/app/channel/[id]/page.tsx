"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChannelTypeBadge } from "@/components/ChannelTypeBadge";
import { StarRating } from "@/components/StarRating";
import { IntegrationGuide } from "@/components/IntegrationGuide";
import { ReviewModal } from "@/components/ReviewModal";
import { useChannel } from "@/lib/useData";
import { useI18n } from "@/i18n/context";

const statusKeys: Record<string, string> = { online: "online", offline: "offline", unstable: "unstable", unknown: "unknown" };
const statusCls: Record<string, string> = { online: "bg-success", offline: "bg-danger", unstable: "bg-warning", unknown: "bg-muted-foreground" };

const certKeys: Record<string, string | null> = { none: null, verified: "certVerified", premium: "certPremium" };

const ratingKeys: Record<string, string> = { stability: "stability", speed: "speed", service: "service", value: "value" };

export default function ChannelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { channel: ch, loading } = useChannel(id);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="animate-pulse text-2xl text-muted">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!ch) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-foreground">{t.channel.notFound}</h1>
          <p className="mt-2 text-muted">{t.channel.notFoundDesc}</p>
          <a href="/channels" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-white font-medium hover:bg-primary/90 transition-colors">
            {t.channel.backToList}
          </a>
        </main>
        <Footer />
      </>
    );
  }

  const sKey = statusKeys[ch.status] || "unknown";
  const certKey = certKeys[ch.certLevel];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted">
          <a href="/" className="hover:text-foreground transition-colors">{t.channel.home}</a>
          <span className="mx-2">/</span>
          <a href="/channels" className="hover:text-foreground transition-colors">{t.channel.channelDir}</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{ch.name}</span>
        </nav>

        {/* ── Hero Card ── */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: name, type, status */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl">
                {ch.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{ch.name}</h1>
                  <ChannelTypeBadge type={ch.type} />
                  {certKey && <span className="text-xs font-medium text-primary">{(t.channel as any)[certKey]}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusCls[ch.status] || "bg-muted-foreground"}`} />
                  <span>{(t.channel as any)[sKey]}</span>
                  <span>·</span>
                  <span>{t.channel.latency} {ch.stats.avgLatency}ms</span>
                  <span>·</span>
                  <span>{t.channel.uptime} {ch.stats.uptime30d}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ch.region.map((r) => (
                    <span key={r} className="rounded bg-surface px-2 py-0.5 text-xs text-muted uppercase">{r}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: overall rating */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-4xl font-bold text-foreground">{ch.ratings.overall.toFixed(1)}</div>
              <StarRating value={ch.ratings.overall} size="md" showValue={false} />
              <p className="text-xs text-muted mt-1">{ch.ratings.count} {t.channel.userReviews}</p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-5 text-muted leading-relaxed">{locale === "en" && ch.descriptionEn ? ch.descriptionEn : ch.description}</p>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={ch.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              {t.channel.visitSite}
            </a>
            {ch.docUrl && (
              <a href={ch.docUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">
                {t.channel.viewDocs}
              </a>
            )}
            <button onClick={() => setReviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">
              {t.channel.review}
            </button>
            <a href={`/compare?ids=${ch.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">
              {t.channel.compare}
            </a>
          </div>
        </div>

        {/* ── Rating Breakdown ── */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.channel.ratingBreakdown}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.entries(ratingKeys) as [string, string][]).map(([key, rKey]) => {
              const val = ch.ratings[key as keyof typeof ch.ratings] as number;
              return (
                <div key={key} className="rounded-xl bg-surface p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{val.toFixed(1)}</div>
                  <StarRating value={val} size="sm" />
                  <div className="mt-1 text-xs text-muted">{(t.channel as any)[rKey]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Models & Pricing ── */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.channel.modelsAndPricing}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-muted">
                  <th className="pb-3 pr-4 font-medium">{t.channel.model}</th>
                  <th className="pb-3 pr-4 font-medium">{t.channel.type}</th>
                  <th className="pb-3 pr-4 font-medium">{t.channel.inputPrice}</th>
                  <th className="pb-3 pr-4 font-medium">{t.channel.outputPrice}</th>
                  <th className="pb-3 font-medium">{t.channel.context}</th>
                </tr>
              </thead>
              <tbody>
                {ch.models.map((m) => (
                  <tr key={m.id} className="border-b border-card-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {m.name}
                      {m.isFree && <span className="ml-2 rounded bg-success/15 px-1.5 py-0.5 text-xs font-medium text-success">{t.channel.free}</span>}
                    </td>
                    <td className="py-3 pr-4 text-muted">{m.category}</td>
                    <td className="py-3 pr-4 text-foreground">
                      {m.inputPricePer1M != null ? `$${m.inputPricePer1M}/1M` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {m.outputPricePer1M != null ? `$${m.outputPricePer1M}/1M` : "—"}
                    </td>
                    <td className="py-3 text-muted">
                      {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}K` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Integration Guide ── */}
        <div className="mt-6">
          <IntegrationGuide channel={ch} />
        </div>

        {/* ── Free Tier ── */}
        {ch.freeTier?.available && (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6">
            <h2 className="text-lg font-semibold text-success mb-2">🎁 {t.channel.freeTier}</h2>
            <p className="text-foreground">{locale === "en" && ch.freeTier.descriptionEn ? ch.freeTier.descriptionEn : ch.freeTier.description}</p>
          </div>
        )}

        {/* ── Payment Methods ── */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t.channel.paymentMethods}</h2>
          <div className="flex flex-wrap gap-2">
            {ch.paymentMethods.map((pm) => (
              <span key={pm} className="rounded-lg bg-surface px-3 py-1.5 text-sm text-foreground">{pm}</span>
            ))}
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t.channel.tags}</h2>
          <div className="flex flex-wrap gap-2">
            {(locale === "en" && ch.tagsEn?.length ? ch.tagsEn : ch.tags).map((tag) => (
              <span key={tag} className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted">{tag}</span>
            ))}
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t.channel.userReviews}</h2>
            <button onClick={() => setReviewOpen(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              {t.channel.writeReview}
            </button>
          </div>
          <div className="text-center py-8 text-muted text-sm">
            <div className="text-3xl mb-2">💬</div>
            <p>{t.channel.noReviews}</p>
            <p className="mt-1 text-xs">{t.channel.noReviewsHint}</p>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modals */}
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} channelName={ch.name} channelId={ch.id} />
    </>
  );
}
