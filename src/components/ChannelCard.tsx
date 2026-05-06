import type { Channel } from "@/types";
import { ChannelTypeBadge } from "./ChannelTypeBadge";
import { StarRating } from "./StarRating";

const statusConfig = {
  online:   { label: "在线",   dot: "bg-success" },
  offline:  { label: "离线",   dot: "bg-danger" },
  unstable: { label: "不稳定", dot: "bg-warning" },
  unknown:  { label: "未知",   dot: "bg-muted-foreground" },
};

const certConfig = {
  none: null,
  verified: { label: "✓ 已认证", cls: "text-primary" },
  premium:  { label: "★ 高级认证", cls: "text-warning" },
};

export function ChannelCard({ channel }: { channel: Channel }) {
  const status = statusConfig[channel.status];
  const cert = certConfig[channel.certLevel];

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
                  <span className={`text-xs font-medium ${cert.cls}`}>{cert.label}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
                <span>{status.label}</span>
                <span>· 延迟 {channel.stats.avgLatency}ms</span>
                <span>· 可用率 {channel.stats.uptime30d}%</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <StarRating value={channel.ratings.overall} size="sm" showValue />
            <p className="text-xs text-muted mt-0.5">{channel.stats.reviewCount} 条评价</p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted line-clamp-2">
          {channel.description}
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
                <span className="font-medium text-success">免费</span>
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
                🎁 {channel.freeTier.description}
              </span>
            )}
            {channel.tags.slice(0, 3).map((tag) => (
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
