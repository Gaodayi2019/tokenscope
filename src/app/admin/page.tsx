"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/i18n/context";

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  url: string;
  region: string;
  cert_level: string;
  featured: boolean;
  description: string;
  description_en: string;
  doc_url: string;
  tags: string[];
  tags_en: string[];
  payment_methods: string[];
  free_tier_available: boolean;
  free_tier_description: string;
  free_tier_description_en: string;
  model_count: number;
}

interface Model {
  id: string;
  channel_id: string;
  name: string;
  category: string;
  input_price_per_1m: number;
  output_price_per_1m: number;
  is_free: boolean;
  free_quota: string;
  context_window: number;
}

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
  const [tab, setTab] = useState<"submissions" | "channels" | "models">("submissions");

  // Channel management state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [chLoading, setChLoading] = useState(false);
  const [chSearch, setChSearch] = useState("");
  const [chTypeFilter, setChTypeFilter] = useState("");
  const [chStatusFilter, setChStatusFilter] = useState("");
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);

  // Model management state
  const [modelChannels, setModelChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [mdlLoading, setMdlLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [mdlSaving, setMdlSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (tab === "channels") fetchChannels();
    if (tab === "models") fetchModelChannels();
  }, [tab]);

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

  const fetchChannels = async () => {
    setChLoading(true);
    try {
      const params = new URLSearchParams();
      if (chSearch) params.set("search", chSearch);
      if (chTypeFilter) params.set("type", chTypeFilter);
      if (chStatusFilter) params.set("status", chStatusFilter);
      const res = await fetch(`/api/admin/channels?${params}`);
      if (res.ok) setChannels(await res.json());
    } catch { /* */ } finally { setChLoading(false); }
  };

  const fetchModelChannels = async () => {
    try {
      const res = await fetch("/api/admin/channels");
      if (res.ok) setModelChannels(await res.json());
    } catch { /* */ }
  };

  const fetchModels = async (channelId: string) => {
    setMdlLoading(true);
    try {
      const res = await fetch(`/api/admin/models?channel_id=${channelId}`);
      if (res.ok) setModels(await res.json());
    } catch { /* */ } finally { setMdlLoading(false); }
  };

  const handleSaveChannel = async () => {
    if (!editingChannel) return;
    setSaving(true);
    try {
      const { id, model_count, ...fields } = editingChannel;
      const res = await fetch("/api/admin/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      if (res.ok) { setEditingChannel(null); fetchChannels(); }
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm(t.admin.deleteConfirm)) return;
    try {
      const res = await fetch("/api/admin/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchChannels();
    } catch { /* */ }
  };

  const handleSaveModel = async () => {
    if (!editingModel) return;
    setMdlSaving(true);
    try {
      const { id, channel_id, ...fields } = editingModel;
      const res = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      if (res.ok) { setEditingModel(null); fetchModels(selectedChannelId); }
    } catch { /* */ } finally { setMdlSaving(false); }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm(t.admin.deleteConfirm)) return;
    try {
      const res = await fetch("/api/admin/models", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchModels(selectedChannelId);
    } catch { /* */ }
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
          <button
            onClick={() => setTab("models")}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "models" ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            🤖 {t.admin.modelMgmt}
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
          <div>
            {/* Search & Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder={t.admin.searchChannels}
                value={chSearch}
                onChange={(e) => setChSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchChannels()}
                className="flex-1 min-w-[200px] rounded-xl border border-card-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <select
                value={chTypeFilter}
                onChange={(e) => setChTypeFilter(e.target.value)}
                className="rounded-xl border border-card-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t.admin.filterType}</option>
                <option value="relay">🔄 中转站</option>
                <option value="proxy">🎫 代理</option>
                <option value="free-model">🎁 免费模型</option>
                <option value="direct">🏢 直连</option>
                <option value="hosting">☁️ 托管</option>
              </select>
              <select
                value={chStatusFilter}
                onChange={(e) => setChStatusFilter(e.target.value)}
                className="rounded-xl border border-card-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t.admin.filterStatus}</option>
                <option value="online">🟢 {t.admin.online}</option>
                <option value="offline">🔴 {t.admin.offline}</option>
                <option value="unstable">🟡 {t.admin.unstable}</option>
              </select>
              <button
                onClick={fetchChannels}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t.common.search}
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              {t.admin.totalChannels.replace("{n}", String(channels.length))}
            </p>

            {/* Channel cards */}
            {chLoading ? (
              <div className="text-center py-8 text-muted">{t.common.loading}</div>
            ) : channels.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-muted">{t.admin.noChannels}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => {
                  const statusDot: Record<string, string> = { online: "bg-green-400", offline: "bg-red-400", unstable: "bg-yellow-400" };
                  const statusText: Record<string, string> = { online: t.admin.online, offline: t.admin.offline, unstable: t.admin.unstable };
                  return (
                    <div key={ch.id} className="rounded-2xl border border-card-border bg-card-bg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[ch.status] || "bg-gray-400"}`} />
                          <h3 className="font-semibold text-foreground truncate">{ch.name}</h3>
                          <span className="text-xs bg-surface px-2 py-0.5 rounded-full">{typeLabels[ch.type] || ch.type}</span>
                          <span className="text-xs text-muted">{t.admin.modelCount}: {ch.model_count ?? 0}</span>
                          {ch.featured && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">⭐ {t.admin.featured}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            onClick={() => setEditingChannel(editingChannel?.id === ch.id ? null : ch)}
                            className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
                          >
                            {editingChannel?.id === ch.id ? t.admin.cancel : t.admin.editChannel}
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(ch.id)}
                            className="rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/25"
                          >
                            {t.admin.delete}
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                        <span>{statusText[ch.status] || ch.status}</span>
                        <span>·</span>
                        <span>{ch.url}</span>
                        {ch.region && <><span>·</span><span>{ch.region}</span></>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Channel edit panel */}
            {editingChannel && (
              <div className="mt-4 rounded-2xl border-2 border-primary/30 bg-card-bg p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4">{t.admin.editChannel}: {editingChannel.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">{t.admin.basicInfo}</h4>
                    <div className="space-y-2">
                      <div><label className="text-xs text-muted">{t.admin.name}</label><input value={editingChannel.name} onChange={(e) => setEditingChannel({...editingChannel, name: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div className="flex gap-2">
                        <div className="flex-1"><label className="text-xs text-muted">{t.admin.type}</label><select value={editingChannel.type} onChange={(e) => setEditingChannel({...editingChannel, type: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground"><option value="relay">中转站</option><option value="proxy">代理</option><option value="free-model">免费模型</option><option value="direct">直连</option><option value="hosting">托管</option></select></div>
                        <div className="flex-1"><label className="text-xs text-muted">{t.admin.status}</label><select value={editingChannel.status} onChange={(e) => setEditingChannel({...editingChannel, status: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground"><option value="online">{t.admin.online}</option><option value="offline">{t.admin.offline}</option><option value="unstable">{t.admin.unstable}</option></select></div>
                      </div>
                      <div><label className="text-xs text-muted">{t.admin.url}</label><input value={editingChannel.url} onChange={(e) => setEditingChannel({...editingChannel, url: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.docUrl}</label><input value={editingChannel.doc_url} onChange={(e) => setEditingChannel({...editingChannel, doc_url: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div className="flex gap-2">
                        <div className="flex-1"><label className="text-xs text-muted">{t.admin.certLevel}</label><select value={editingChannel.cert_level} onChange={(e) => setEditingChannel({...editingChannel, cert_level: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground"><option value="none">{t.admin.certNone}</option><option value="verified">{t.admin.certVerified}</option><option value="premium">{t.admin.certPremium}</option></select></div>
                        <div className="flex-1"><label className="text-xs text-muted">{t.admin.region}</label><select value={editingChannel.region} onChange={(e) => setEditingChannel({...editingChannel, region: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground"><option value="cn">{t.admin.regionCN}</option><option value="us">{t.admin.regionUS}</option><option value="eu">{t.admin.regionEU}</option><option value="asia">{t.admin.regionAsia}</option><option value="global">{t.admin.regionGlobal}</option></select></div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={editingChannel.featured} onChange={(e) => setEditingChannel({...editingChannel, featured: e.target.checked})} className="rounded" />{t.admin.featured}</label>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">{t.admin.detailInfo}</h4>
                    <div className="space-y-2">
                      <div><label className="text-xs text-muted">{t.admin.descCn}</label><textarea value={editingChannel.description} onChange={(e) => setEditingChannel({...editingChannel, description: e.target.value})} rows={2} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.descEn}</label><textarea value={editingChannel.description_en} onChange={(e) => setEditingChannel({...editingChannel, description_en: e.target.value})} rows={2} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.tagsCn}</label><input value={(editingChannel.tags || []).join(", ")} onChange={(e) => setEditingChannel({...editingChannel, tags: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.tagsEn}</label><input value={(editingChannel.tags_en || []).join(", ")} onChange={(e) => setEditingChannel({...editingChannel, tags_en: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.paymentMethods}</label><input value={(editingChannel.payment_methods || []).join(", ")} onChange={(e) => setEditingChannel({...editingChannel, payment_methods: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={editingChannel.free_tier_available} onChange={(e) => setEditingChannel({...editingChannel, free_tier_available: e.target.checked})} className="rounded" />{t.admin.freeTier}</label>
                      <div><label className="text-xs text-muted">{t.admin.freeTierDescCn}</label><input value={editingChannel.free_tier_description} onChange={(e) => setEditingChannel({...editingChannel, free_tier_description: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                      <div><label className="text-xs text-muted">{t.admin.freeTierDescEn}</label><input value={editingChannel.free_tier_description_en} onChange={(e) => setEditingChannel({...editingChannel, free_tier_description_en: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-3 py-1.5 text-sm text-foreground" /></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleSaveChannel} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{saving ? t.admin.saving : t.admin.save}</button>
                  <button onClick={() => setEditingChannel(null)} className="rounded-xl bg-surface px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-hover">{t.admin.cancel}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "models" && (
          <div>
            {/* Channel selector */}
            <div className="mb-4 flex gap-3">
              <select
                value={selectedChannelId}
                onChange={(e) => { setSelectedChannelId(e.target.value); if (e.target.value) fetchModels(e.target.value); else setModels([]); }}
                className="flex-1 rounded-xl border border-card-border bg-surface px-4 py-2 text-sm text-foreground"
              >
                <option value="">{t.admin.selectChannel}</option>
                {modelChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name} ({ch.model_count ?? 0} {t.admin.modelCount})</option>
                ))}
              </select>
            </div>

            {mdlLoading ? (
              <div className="text-center py-8 text-muted">{t.common.loading}</div>
            ) : !selectedChannelId ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🤖</div>
                <p className="text-muted">{t.admin.selectChannel}</p>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-muted">{t.admin.noModels}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs text-muted">
                      <th className="pb-2 pr-3">{t.admin.modelName}</th>
                      <th className="pb-2 pr-3">{t.admin.category}</th>
                      <th className="pb-2 pr-3">{t.admin.inputPrice}</th>
                      <th className="pb-2 pr-3">{t.admin.outputPrice}</th>
                      <th className="pb-2 pr-3">{t.admin.isFree}</th>
                      <th className="pb-2 pr-3">{t.admin.freeQuota}</th>
                      <th className="pb-2 pr-3">{t.admin.contextWindow}</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((mdl) => (
                      <tr key={mdl.id} className={`border-b border-card-border/50 ${editingModel?.id === mdl.id ? "bg-primary/5" : ""}`}>
                        {editingModel?.id === mdl.id ? (
                          <>
                            <td className="py-2 pr-3"><input value={editingModel.name} onChange={(e) => setEditingModel({...editingModel, name: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground" /></td>
                            <td className="py-2 pr-3"><select value={editingModel.category} onChange={(e) => setEditingModel({...editingModel, category: e.target.value})} className="rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground"><option value="chat">Chat</option><option value="code">Code</option><option value="vision">Vision</option><option value="embedding">Embedding</option><option value="image">Image</option><option value="audio">Audio</option><option value="reasoning">Reasoning</option></select></td>
                            <td className="py-2 pr-3"><input type="number" step="0.01" value={editingModel.input_price_per_1m ?? ""} onChange={(e) => setEditingModel({...editingModel, input_price_per_1m: parseFloat(e.target.value) || 0})} className="w-20 rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground" /></td>
                            <td className="py-2 pr-3"><input type="number" step="0.01" value={editingModel.output_price_per_1m ?? ""} onChange={(e) => setEditingModel({...editingModel, output_price_per_1m: parseFloat(e.target.value) || 0})} className="w-20 rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground" /></td>
                            <td className="py-2 pr-3"><input type="checkbox" checked={editingModel.is_free} onChange={(e) => setEditingModel({...editingModel, is_free: e.target.checked})} className="rounded" /></td>
                            <td className="py-2 pr-3"><input value={editingModel.free_quota || ""} onChange={(e) => setEditingModel({...editingModel, free_quota: e.target.value})} className="w-full rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground" /></td>
                            <td className="py-2 pr-3"><input type="number" value={editingModel.context_window ?? ""} onChange={(e) => setEditingModel({...editingModel, context_window: parseInt(e.target.value) || 0})} className="w-24 rounded-lg border border-card-border bg-surface px-2 py-1 text-xs text-foreground" /></td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <button onClick={handleSaveModel} disabled={mdlSaving} className="rounded bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25">{mdlSaving ? t.admin.saving : t.admin.save}</button>
                                <button onClick={() => setEditingModel(null)} className="rounded bg-surface px-2 py-1 text-xs text-foreground hover:bg-surface-hover">{t.admin.cancel}</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3 font-medium text-foreground">{mdl.name}</td>
                            <td className="py-2 pr-3"><span className="bg-surface px-2 py-0.5 rounded-full text-xs">{mdl.category}</span></td>
                            <td className="py-2 pr-3 text-xs">${mdl.input_price_per_1m}</td>
                            <td className="py-2 pr-3 text-xs">${mdl.output_price_per_1m}</td>
                            <td className="py-2 pr-3">{mdl.is_free ? "✅" : ""}</td>
                            <td className="py-2 pr-3 text-xs">{mdl.free_quota || "-"}</td>
                            <td className="py-2 pr-3 text-xs">{mdl.context_window ? `${mdl.context_window/1000}k` : "-"}</td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <button onClick={() => setEditingModel(mdl)} className="rounded bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25">{t.admin.editChannel}</button>
                                <button onClick={() => handleDeleteModel(mdl.id)} className="rounded bg-danger/15 px-2 py-1 text-xs text-danger hover:bg-danger/25">{t.admin.delete}</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
