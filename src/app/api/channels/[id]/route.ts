import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Transform flat snake_case DB row → nested camelCase ──

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
    models: (row.models || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      category: m.category || "chat",
      inputPricePer1M: m.input_price_per_1m ?? undefined,
      outputPricePer1M: m.output_price_per_1m ?? undefined,
      isFree: m.is_free ?? false,
      freeQuota: m.free_quota ?? undefined,
      contextWindow: m.context_window ?? undefined,
    })),
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

// GET /api/channels/[id] - single channel with models + reviews
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: channel, error: chErr } = await supabase
    .from("channels")
    .select("*, models(*)")
    .eq("id", id)
    .single();

  if (chErr || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("channel_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: uptime } = await supabase
    .from("uptime_checks")
    .select("status, latency_ms, checked_at")
    .eq("channel_id", id)
    .order("checked_at", { ascending: false })
    .limit(30);

  const transformed = transformChannel(channel);
  return NextResponse.json({ ...transformed, reviews: reviews || [], uptime: uptime || [] });
}
