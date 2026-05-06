"use client";

import { useState } from "react";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  channelName: string;
  channelId: string;
}

export function ReviewModal({ open, onClose, channelName, channelId }: ReviewModalProps) {
  const [ratings, setRatings] = useState({ stability: 0, speed: 0, service: 0, value: 0 });
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!open) return null;

  const dims = [
    { key: "stability", label: "稳定性" },
    { key: "speed", label: "速度" },
    { key: "service", label: "服务" },
    { key: "value", label: "性价比" },
  ] as const;

  const avg = Object.values(ratings).every((v) => v > 0)
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / 4).toFixed(1)
    : null;

  const handleSubmit = async () => {
    if (Object.values(ratings).some((v) => v === 0) || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, ...ratings, content }),
      });
      if (res.ok) setDone(true);
    } catch {
      /* handle error */
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setRatings({ stability: 0, speed: 0, service: 0, value: 0 });
    setContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-card-border bg-card-bg p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-foreground">评价已提交！</h3>
            <p className="mt-2 text-sm text-muted">感谢你的真实反馈</p>
            <button onClick={handleClose} className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90">
              好的
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">⭐ 评价 {channelName}</h3>
              <button onClick={handleClose} className="text-muted hover:text-foreground text-xl">×</button>
            </div>

            {/* Rating dimensions */}
            <div className="space-y-4 mb-5">
              {dims.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground w-16">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = hovered === key ? star <= (ratings[key] || 0) : star <= ratings[key];
                      return (
                        <button
                          key={star}
                          onClick={() => setRatings({ ...ratings, [key]: star })}
                          onMouseEnter={() => setHovered(key)}
                          onMouseLeave={() => setHovered(null)}
                          className={`text-xl transition-colors ${filled ? "text-yellow-400" : "text-muted/30 hover:text-yellow-300"}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-sm text-muted w-6 text-right">{ratings[key] || "-"}</span>
                </div>
              ))}
            </div>

            {avg && (
              <div className="text-center mb-4 py-2 rounded-xl bg-primary/10">
                <span className="text-sm text-muted">综合评分：</span>
                <span className="text-lg font-bold text-primary ml-2">{avg}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">使用感受 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="分享你的真实使用体验，帮助其他人做出选择..."
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleClose}
                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={Object.values(ratings).some((v) => v === 0) || !content.trim() || submitting}
                className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "提交中..." : "提交评价"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
