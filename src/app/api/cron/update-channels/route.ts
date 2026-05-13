import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { parseAllSources } from "@/lib/channel-parsers";
import { autoTranslateChannels, isTranslationEnabled } from "@/lib/channel-translate";
import type { ParsedChannelData, ParsedDiscoveryResult } from "@/lib/channel-parsers";

// Vercel Cron Job — daily channel data update
// Triggered by Vercel cron (vercel.json) or manual curl with CRON_SECRET

export async function GET(req: NextRequest) {
  // Verify cron request — allow Vercel cron OR manual with CRON_SECRET
  const isVercelCron = req.headers.get("x-vercel-cron") === "true";
  const authHeader = req.headers.get("authorization");
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const sb = createServerClient();

  const stats = {
    channelsUpdated: 0,
    channelsAdded: 0,
    modelsUpdated: 0,
    modelsAdded: 0,
    discoveriesTotal: 0,
    discoveriesNew: 0,
    errors: [] as string[],
  };

  try {
    // ── Step 1: Parse all sources ──────────────────────────
    console.log("[cron] Starting parseAllSources...");
    const { channels, discoveries } = await parseAllSources();
    console.log(`[cron] Parsed: ${channels.length} channels, ${discoveries.length} discoveries`);

    // ── Step 1.5: Auto-translate bilingual fields ──────────
    const translateEnabled = isTranslationEnabled();
    console.log(`[cron] Translation: ${translateEnabled ? 'LLM enabled' : 'static mappings only'}`);
    // Collect channel data for translation
    const translatable = channels.map(c => ({
      id: c.channel.id,
      name: c.channel.name,
      type: c.channel.type || 'relay',
      description: c.channel.description,
      description_en: c.channel.description_en,
      tags: c.channel.tags,
      tags_en: c.channel.tags_en,
      free_tier_description: c.channel.free_tier_description,
      free_tier_description_en: c.channel.free_tier_description_en,
      models: c.models.map(m => ({ name: m.name })),
    }));
    await autoTranslateChannels(translatable);
    // Write translated fields back to parsed channel objects
    for (const parsed of channels) {
      const t = translatable.find(x => x.id === parsed.channel.id);
      if (t) {
        if (t.description) parsed.channel.description = t.description;
        if (t.description_en) parsed.channel.description_en = t.description_en;
        if (t.tags) parsed.channel.tags = t.tags;
        if (t.tags_en) parsed.channel.tags_en = t.tags_en;
        if (t.free_tier_description) parsed.channel.free_tier_description = t.free_tier_description;
        if (t.free_tier_description_en) parsed.channel.free_tier_description_en = t.free_tier_description_en;
      }
    }

    // ── Step 2: Upsert channels + models ───────────────────
    for (const parsed of channels) {
      try {
        await upsertChannelWithModels(sb, parsed, stats);
      } catch (err: any) {
        const msg = `Channel ${parsed.channel.id}: ${err.message}`;
        console.error(`[cron] ${msg}`);
        stats.errors.push(msg);
      }
    }

    // ── Step 3: Log discoveries (no auto-insert) ──────────
    for (const disc of discoveries) {
      try {
        await logDiscoveries(sb, disc, stats);
      } catch (err: any) {
        stats.errors.push(`Discovery log: ${err.message}`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[cron] Completed in ${elapsed}ms`, stats);

    return NextResponse.json({
      success: true,
      elapsed_ms: elapsed,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[cron] Fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message, ...stats },
      { status: 500 }
    );
  }
}

// ========== Upsert Logic ==========

async function upsertChannelWithModels(
  sb: ReturnType<typeof createServerClient>,
  parsed: ParsedChannelData,
  stats: Record<string, any>
) {
  const ch = sanitizeChannel(parsed.channel);

  // Upsert channel
  const { data: existingCh, error: chErr } = await sb
    .from("channels")
    .select("id")
    .eq("id", ch.id)
    .maybeSingle();

  if (chErr) throw chErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelsTable: any = sb.from("channels");

  if (existingCh) {
    // Update existing
    // @ts-ignore
    const { error } = await channelsTable.update(ch).eq("id", ch.id);
    if (error) throw error;
    stats.channelsUpdated++;
  } else {
    // Insert new
    // @ts-ignore
    const { error } = await channelsTable.insert(ch);
    if (error) throw error;
    stats.channelsAdded++;
  }

  // Sync models
  if (parsed.models && parsed.models.length > 0) {
    await syncModels(sb, ch.id, parsed.models, stats);
  }
}

async function syncModels(
  sb: ReturnType<typeof createServerClient>,
  channelId: string,
  newModels: Record<string, any>[],
  stats: Record<string, any>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelsTable: any = sb.from("models");

  // Get existing models for this channel
  const { data: existing, error: fetchErr } = modelsTable
    .select("name")
    .eq("channel_id", channelId);

  if (fetchErr) throw fetchErr;

  const existingNames = new Set((existing || []).map((m: any) => m.name));
  const toInsert: Record<string, any>[] = [];
  const toUpdate: Record<string, any>[] = [];

  for (const m of newModels) {
    const sanitized = sanitizeModel({ ...m, channel_id: channelId });
    if (existingNames.has(sanitized.name)) {
      toUpdate.push(sanitized);
    } else {
      toInsert.push(sanitized);
    }
  }

  // Insert new models
  if (toInsert.length > 0) {
    // @ts-ignore
    const { error } = await modelsTable.insert(toInsert);
    if (error) {
      // Fallback: insert one by one to find the bad row
      for (const model of toInsert) {
        // @ts-ignore
        const { error: e2 } = await modelsTable.insert(model);
        if (e2) {
          console.error(`[cron] Model insert failed (${model.name}):`, e2.message);
        } else {
          stats.modelsAdded++;
        }
      }
    } else {
      stats.modelsAdded += toInsert.length;
    }
  }

  // Update existing models (pricing, context_window, etc.)
  for (const model of toUpdate) {
    const updateData: Record<string, any> = {
        input_price_per_1m: model.input_price_per_1m,
        output_price_per_1m: model.output_price_per_1m,
        context_window: model.context_window,
        is_free: model.is_free,
        free_quota: model.free_quota,
      };
    // @ts-ignore
    const { error } = await modelsTable
      .update(updateData)
      .eq("channel_id", channelId)
      .eq("name", model.name);

    if (error) {
      console.error(`[cron] Model update failed (${model.name}):`, error.message);
    } else {
      stats.modelsUpdated++;
    }
  }
}

// ========== Discovery → channel_submissions ==========

async function logDiscoveries(
  sb: ReturnType<typeof createServerClient>,
  discovery: ParsedDiscoveryResult,
  stats: Record<string, any>
) {
  const stations = discovery.discoveredStations || [];
  if (stations.length === 0) return;

  // Fetch existing channel URLs for dedup
  const { data: existingChannels } = await sb
    .from("channels")
    .select("url");
  const existingUrls = new Set((existingChannels || []).map((c: any) => normalizeUrl(c.url)));

  // Fetch existing submission URLs for dedup (avoid re-inserting pending ones)
  const { data: existingSubs } = await sb
    .from("channel_submissions")
    .select("url")
    .in("status", ["pending", "approved"]);
  const existingSubUrls = new Set((existingSubs || []).map((s: any) => normalizeUrl(s.url)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toInsert: any[] = [];

  for (const s of stations) {
    if (!s.url || !s.name) continue;

    // Quality filter: skip non-API URLs
    if (!isLikelyApiProvider(s.url, s.name)) {
      console.log(`[cron] Discovery skip (not an API provider): ${s.name} — ${s.url}`);
      continue;
    }

    const normUrl = normalizeUrl(s.url);
    if (existingUrls.has(normUrl)) {
      console.log(`[cron] Discovery skip (already a channel): ${s.name} — ${s.url}`);
      continue;
    }
    if (existingSubUrls.has(normUrl)) {
      console.log(`[cron] Discovery skip (already submitted): ${s.name} — ${s.url}`);
      continue;
    }

    toInsert.push({
      name: s.name,
      type: "relay",
      description: s.notes || `Auto-discovered channel`,
      url: s.url,
      submitter_note: `Auto-discovered by cron at ${new Date().toISOString()}`,
      status: "pending",
    });
    existingSubUrls.add(normUrl); // Prevent duplicates within this batch
  }

  if (toInsert.length > 0) {
    // @ts-ignore
    const { error } = await sb.from("channel_submissions").insert(toInsert);
    if (error) {
      console.error(`[cron] Discovery insert failed:`, error.message);
      stats.errors.push(`Discovery insert: ${error.message}`);
    } else {
      console.log(`[cron] Inserted ${toInsert.length} new discoveries into channel_submissions`);
    }
  }

  stats.discoveriesTotal += stations.length;
  stats.discoveriesNew += toInsert.length;
  console.log(`[cron] Discovery summary: ${stations.length} found, ${toInsert.length} new, ${stations.length - toInsert.length} duplicates`);
}

/** Filter out non-API-provider URLs (docs, images, blog posts, etc.) */
function isLikelyApiProvider(url: string, name: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const hostname = u.hostname.toLowerCase();

    // Skip image/chart files
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|svg)$/i.test(path)) return false;
    // Skip document/markdown files
    if (/\.(md|pdf|doc|docx|txt)$/i.test(path)) return false;
    // Skip model detail pages (e.g. /openai/gpt-4o-2024-11-20, /models/gpt-4o)
    if (/^\/[^/]+\/[^/]+-\d{4}/.test(path)) return false; // org/model-date pattern
    if (/^\/models\//.test(path)) return false;
    // Skip registration pages with affiliate params
    if (/\/register\?/.test(path) && /aff=/.test(u.search)) return false;
    // Skip hvoy.ai relay redirect links (not actual provider URLs)
    if (/hvoy\.ai\/relaySite/.test(url)) return false;
    // Skip star-history.com chart URLs
    if (/star-history\.com/.test(hostname)) return false;
    // Skip dashboard/demo paths that aren't the main site
    if (/^\/(dashboard|demo|admin|login|signup|register|pricing|docs|blog|wiki|help|support|tutorial|guide|changelog|news|models)\/?$/i.test(path) && path !== '/') return false;
    // Skip subpages of known platforms that are already channels
    if (/openrouter\.ai\/[^/]+\//.test(url) && !/api\.openrouter\.ai/.test(url)) return false;
    // Skip common non-API path patterns
    if (/^\/(docs|blog|wiki|help|support|tutorial|guide|changelog|news)\//i.test(path)) return false;
    // Skip GitHub repos (not actual API endpoints) — but allow github.io pages
    if (hostname === 'github.com' || hostname === 'gist.github.com') return false;
    // Skip URL shorteners and image hosts
    if (/(imgur|imgdd|imgbb|flickr|tinypic|postimg)\.com$/i.test(hostname)) return false;
    // Skip social media
    if (/(twitter\.com|x\.com|facebook\.com|reddit\.com|weibo\.com|zhihu\.com)$/i.test(hostname)) return false;
    // Skip if name looks like a tutorial/guide (Chinese)
    if (/(教程|指南|配置|推荐|排行|评测|对比|测评|架构|原理|入门)/.test(name)) return false;
    // Skip if name starts with ! (markdown image syntax)
    if (/^!/.test(name)) return false;
    // Skip if name is a URL itself (poorly parsed link)
    if (/^https?:\/\//.test(name)) return false;

    return true;
  } catch {
    return false;
  }
}

/** Normalize URL for dedup: lowercase, remove trailing slash, strip protocol */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

// ========== Sanitizers ==========

/** Only keep fields that exist in the channels table */
function sanitizeChannel(ch: Record<string, any>): Record<string, any> {
  // Must match actual channels table columns
  const allowed = [
    "id", "name", "type", "description", "description_en",
    "url", "doc_url", "status", "cert_level", "region",
    "tags", "tags_en", "payment_methods",
    "free_tier_available", "free_tier_description", "free_tier_description_en",
    "avg_latency", "uptime_30d", "review_count", "monthly_active_users",
    "rating_overall", "rating_stability", "rating_speed", "rating_service",
    "rating_value", "rating_count",
    "featured", "created_at", "updated_at",
  ];
  const out: Record<string, any> = {};
  for (const key of allowed) {
    if (ch[key] !== undefined) out[key] = ch[key];
  }
  // Ensure required fields
  if (!out.id) throw new Error("Channel missing id");
  if (!out.name) out.name = out.id;
  if (!out.type) out.type = "relay";
  if (!out.url) throw new Error(`Channel ${out.id} missing required field: url`);
  if (!out.updated_at) out.updated_at = new Date().toISOString();
  return out;
}

/** Only keep fields that exist in the models table */
function sanitizeModel(m: Record<string, any>): Record<string, any> {
  // Must match actual models table columns
  const allowed = [
    "channel_id", "name", "category",
    "input_price_per_1m", "output_price_per_1m",
    "is_free", "free_quota", "context_window",
  ];
  const out: Record<string, any> = {};
  for (const key of allowed) {
    if (m[key] !== undefined) out[key] = m[key];
  }
  return out;
}
