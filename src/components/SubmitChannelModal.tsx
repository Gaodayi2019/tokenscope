"use client";

import { useState } from "react";
import { ChannelType } from "@/types";
import { useI18n } from "@/i18n/context";

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
            <h3 className="text-xl font-bold text-foreground">{t.submit.submitted}</h3>
            <p className="mt-2 text-sm text-muted">{t.submit.submittedHint}</p>
            <button onClick={handleClose} className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90">
              {t.submit.ok}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">🆕 {t.submit.title}</h3>
              <button onClick={handleClose} className="text-muted hover:text-foreground text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.channelName}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t.submit.channelNamePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.channelType}</label>
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
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.apiUrl}</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://api.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.docsUrl}</label>
                <input
                  value={form.docUrl}
                  onChange={(e) => setForm({ ...form, docUrl: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://docs.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={t.submit.descriptionPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.email}</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.submit.notes}</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-surface border border-card-border px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={t.submit.notesPlaceholder}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                {t.submit.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.url || submitting}
                className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t.submit.submitting : t.submit.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
