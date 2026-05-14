import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Transform flat snake_case DB row → nested camelCase Channel ──

function transformChannel(row: any): any {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description || "",
    descriptionEn: row.description_en || "",
    url: row.url,
    docUrl: row.doc_url || undefined,
    status: row.status || "unknown",
    certLevel: row.cert_level || "none",
    region: row.region || [],
    tags: row.tags || [],
    tagsEn: row.tags_en || [],
    models: (row.models || []).map(transformModel),
    paymentMethods: row.payment_methods || [],
    ratings: {
      overall: row.rating_overall ?? 0,
      stability: row.rating_stability ?? 0,
      speed: row.rating_speed ?? 0,
      service: row.rating_service ?? 0,
      value: row.rating_value ?? 0,
      count: row.rating_count ?? 0,
    },
    stats: {
      avgLatency: row.avg_latency ?? 0,
      uptime30d: row.uptime_30d ?? 0,
      reviewCount: row.review_count ?? 0,
    },
    freeTier: row.free_tier_available
      ? {
          available: true,
          description: row.free_tier_description || "",
          descriptionEn: row.free_tier_description_en || "",
        }
      : undefined,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    featured: row.featured || false,
  };
}

function transformModel(m: any): any {
  return {
    id: m.id,
    name: m.name,
    category: m.category || "chat",
    inputPricePer1M: m.input_price_per_1m ?? undefined,
    outputPricePer1M: m.output_price_per_1m ?? undefined,
    isFree: m.is_free ?? false,
    freeQuota: m.free_quota ?? undefined,
    contextWindow: m.context_window ?? undefined,
  };
}

// GET /api/channels - fetch channels with server-side filtering
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const region = searchParams.get("region");
  const freeOnly = searchParams.get("freeOnly") === "true";
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "rating";
  const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query with server-side filters
  let query = supabase
    .from("channels")
    .select("*, models(*)", { count: "exact" })
    .order("rating_overall", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("type", type);
  if (region) query = query.contains("region", [region]);
  if (freeOnly) query = query.eq("free_tier_available", true);
  if (search) query = query.textSearch("name", search);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let channels = (data || []).map(transformChannel);

  // Client-side sort for fields not directly in DB or needing computed values
  if (sortBy === "price-low") {
    channels.sort((a: any, b: any) => {
      const pa = Math.min(...a.models.filter((m: any) => m.inputPricePer1M != null).map((m: any) => m.inputPricePer1M));
      const pb = Math.min(...b.models.filter((m: any) => m.inputPricePer1M != null).map((m: any) => m.inputPricePer1M));
      return pa - pb;
    });
  } else if (sortBy === "latency") {
    channels.sort((a: any, b: any) => a.stats.avgLatency - b.stats.avgLatency);
  } else if (sortBy === "reviews") {
    channels.sort((a: any, b: any) => b.ratings.count - a.ratings.count);
  } else if (sortBy === "newest") {
    channels.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return NextResponse.json({ channels, total: count || channels.length });
}

// POST /api/channels/submit - user submits a new channel (goes to pending)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, description, url, docUrl, email, note } = body;

  if (!name || !url) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }

  const { error } = await supabase.from("channel_submissions").insert({
    name,
    type,
    description: description || "",
    url,
    doc_url: docUrl || null,
    submitter_email: email || null,
    submitter_note: note || null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
