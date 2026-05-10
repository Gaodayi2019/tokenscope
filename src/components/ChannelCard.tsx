"use client";

import type { Channel } from "@/types";
import { ChannelTypeBadge } from "./ChannelTypeBadge";
import { StarRating } from "./StarRating";
import { useI18n } from "@/i18n/context";

const statusDot = {
  online:   "bg-success",
  offline:  "bg-danger",
  unstable: "bg-warning",
  unknown:  "bg-muted-foreground",
};

const certConfig = {
  none: null,
  verified: { key: "certVerified", cls: "text-primary" } as const,
  premium:  { key: "certPremium",  cls: "text-warning" } as const,
};

export function ChannelCard({ channel }: { channel: Channel }) {
  const { locale, t } = useI18n();
  const statusLabel = t.card[channel.status as keyof typeof t.card] || channel.status;
  const cert = certConfig[channel.certLevel];

  // Pick localized description / tags / freeTier description
  const description = locale === "en" && channel.descriptionEn
    ? channel.descriptionEn
    : channel.description;
  const tags = locale === "en" && channel.tagsEn?.length
    ? channel.tagsEn
    : channel.tags;
  const freeTierDesc = locale === "en" && channel.freeTier?.descriptionEn
    ? channel.freeTier.descriptionEn
    : channel.freeTier?.description;

  return (
    <a href={`/channel/${channel.id}`} className="group block">
      <div className="rounded-2xl border border-card-border bg-card-bg p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {channel.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {channel.name}
                </h3>
                <ChannelTypeBadge type={channel.type} />
                {cert && (
                  <span className={`text-xs font-medium ${cert.cls}`}>
                    {t.card[cert.key]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot[channel.status]}`} />
                <span>{statusLabel}</span>
                <span>· {t.card.latency} {channel.stats.avgLatency}ms</span>
                <span>· {t.card.uptime} {channel.stats.uptime30d}%</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <StarRating value={channel.ratings.overall} size="sm" showValue />
            <p className="text-xs text-muted mt-0.5">{channel.stats.reviewCount} {t.card.reviews}</p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted line-clamp-2">
          {description}
        </p>

        {/* Models */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {channel.models.slice(0, 4).map((model) => (
            <span
              key={model.id}
              className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted"
            >
              {model.name}
              {model.isFree && (
                <span className="font-medium text-success">{t.card.free}</span>
              )}
            </span>
          ))}
          {channel.models.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
              +{channel.models.length - 4}
            </span>
          )}
        </div>

        {/* Free Tier & Tags */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {channel.freeTier?.available && (
              <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                🎁 {freeTierDesc}
              </span>
            )}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-surface px-2 py-0.5 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted shrink-0">
            {channel.region.map((r) => (
              <span key={r} className="uppercase">{r}</span>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}
