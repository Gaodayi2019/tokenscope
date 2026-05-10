"use client";

import { useState } from "react";
import { ChannelType } from "@/types";
import { useI18n } from "@/i18n/context";

const typeOptions: { value: ChannelType; label: string }[] = [
  { value: "relay", label: "🔄 API中转站" },
  { value: "proxy", label: "🎫 Token代理" },
  { value: "free-model", label: "🎁 免费模型" },
  { value: "direct", label: "🏢 官方直连" },
  { value: "hosting", label: "☁️ 托管服务" },
];

interface SubmitChannelModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitChannelModal({ open, onClose }: SubmitChannelModalProps) {
  const [form, setForm] = useState({
    name: "",
    type: "relay" as ChannelType,
    description: "",
    url: "",
    docUrl: "",
    email: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { locale, t } = useI18n();

  const typeOptions: { value: ChannelType; label: string }[] = [
    { value: "relay", label: `🔄 ${t.badge.relay}` },
    { value: "proxy", label: `🎫 ${t.badge.proxy}` },
    { value: "free-model", label: `🎁 ${t.badge["free-model"]}` },
    { value: "direct", label: `🏢 ${t.badge.direct}` },
    { value: "hosting", label: `☁️ ${t.badge.hosting}` },
  ];

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.name || !form.url) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/channels/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    setForm({ name: "", type: "relay", description: "", url: "", docUrl: "", email: "", note: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-card-border bg-card-bg p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-foreground">{locale === "zh" ? "提交成功！" : "Submitted!"}</h3>
            <p className="mt-2 text-sm text-muted">{locale === "zh" ? "管理员审核通过后将自动上线" : "It will go live after admin approval"}</p>
            <button onClick={handleClose} className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90">
              {locale === "zh" ? "好的" : "OK"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">🆕 {locale === "zh" ? "提交新渠道" : "Submit New Channel"}</h3>
              <button onClick={handleClose} className="text-muted hover:text-foreground text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "渠道名称 *" : "Channel Name *"}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={locale === "zh" ? "如：MyRelay" : "e.g. MyRelay"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "渠道类型 *" : "Channel Type *"}</label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        form.type === opt.value
                          ? "bg-primary text-white"
                          : "bg-surface text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "API 地址 *" : "API URL *"}</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://api.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "文档地址" : "Docs URL"}</label>
                <input
                  value={form.docUrl}
                  onChange={(e) => setForm({ ...form, docUrl: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://docs.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "简介" : "Description"}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={locale === "zh" ? "简单描述这个渠道的特点..." : "Brief description of this channel..."}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "你的邮箱（选填，审核结果通知）" : "Your email (optional, for approval notification)"}</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{locale === "zh" ? "补充说明" : "Additional notes"}</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={locale === "zh" ? "你想让管理员知道的额外信息..." : "Any extra info for the admin..."}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                {locale === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.url || submitting}
                className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (locale === "zh" ? "提交中..." : "Submitting...") : (locale === "zh" ? "提交审核" : "Submit for Review")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
