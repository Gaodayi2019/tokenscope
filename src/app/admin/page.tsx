"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/i18n/context";

interface Submission {
  id: string;
  name: string;
  type: string;
  description: string;
  url: string;
  doc_url: string | null;
  submitter_email: string | null;
  submitter_note: string | null;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  relay: "🔄 中转站",
  proxy: "🎫 代理",
  "free-model": "🎁 免费模型",
  direct: "🏢 直连",
  hosting: "☁️ 托管",
};

// status labels will be resolved via i18n at render time
const statusClsMap: Record<string, { cls: string }> = {
  pending: { cls: "text-yellow-400" },
  approved: { cls: "text-success" },
  rejected: { cls: "text-danger" },
};

export default function AdminPage() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"submissions" | "channels">("submissions");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) fetchSubmissions();
    } catch {
      /* empty */
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.admin.title}</h1>
          <p className="mt-1 text-muted">{t.admin.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("submissions")}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "submissions" ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            📋 {t.admin.submissions} {pendingCount > 0 && <span className="ml-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-400">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setTab("channels")}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "channels" ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            📊 {t.admin.channelMgmt}
          </button>
        </div>

        {tab === "submissions" && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-muted">{t.common.loading}</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-muted">{t.admin.noSubmissions}</p>
                <p className="text-xs text-muted mt-1">{t.admin.noSubmissionsHint}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => {
                  const st = statusClsMap[sub.status] || statusClsMap.pending;
                  const statusLabelMap: Record<string, string> = {
                    pending: t.admin.pending,
                    approved: t.admin.approved,
                    rejected: t.admin.rejected,
                  };
                  return (
                    <div key={sub.id} className="rounded-2xl border border-card-border bg-card-bg p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{sub.name}</h3>
                            <span className="text-sm">{typeLabels[sub.type] || sub.type}</span>
                            <span className={`text-xs font-medium ${st.cls}`}>{statusLabelMap[sub.status] || t.admin.pending}</span>
                          </div>
                          <p className="text-sm text-muted mb-2">{sub.description || t.admin.noDesc}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted">
                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              🔗 {sub.url}
                            </a>
                            {sub.doc_url && (
                              <a href={sub.doc_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                📖 {t.admin.docs}
                              </a>
                            )}
                            {sub.submitter_email && <span>📧 {sub.submitter_email}</span>}
                          </div>
                          {sub.submitter_note && (
                            <p className="mt-2 text-xs text-muted bg-surface rounded-lg px-3 py-2">💬 {sub.submitter_note}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t.admin.submittedAt} {new Date(sub.created_at).toLocaleString("zh-CN")}
                          </p>
                        </div>
                        {sub.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleAction(sub.id, "approve")}
                              className="rounded-xl bg-success/15 px-4 py-2 text-sm font-medium text-success hover:bg-success/25 transition-colors"
                            >
                              {t.admin.approve}
                            </button>
                            <button
                              onClick={() => handleAction(sub.id, "reject")}
                              className="rounded-xl bg-danger/15 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/25 transition-colors"
                            >
                              {t.admin.rejectBtn}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "channels" && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-muted">{t.admin.channelMgmtTitle}</p>
            <p className="text-xs text-muted mt-1">{t.admin.channelMgmtHint}</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
