import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/channels - list all channels with model counts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";

  let query = supabase
    .from("channels")
    .select("*, models(count)")
    .order("updated_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten model count
  const channels = (data || []).map((ch: any) => ({
    ...ch,
    model_count: ch.models?.[0]?.count || ch.models?.length || 0,
  }));

  return NextResponse.json(channels);
}

// PATCH /api/admin/channels - update a channel
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Channel id required" }, { status: 400 });

  // Map camelCase to snake_case for DB
  const dbUpdates: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    name: "name",
    type: "type",
    description: "description",
    descriptionEn: "description_en",
    url: "url",
    docUrl: "doc_url",
    status: "status",
    certLevel: "cert_level",
    region: "region",
    tags: "tags",
    tagsEn: "tags_en",
    paymentMethods: "payment_methods",
    freeTierAvailable: "free_tier_available",
    freeTierDescription: "free_tier_description",
    freeTierDescriptionEn: "free_tier_description_en",
    featured: "featured",
  };

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) dbUpdates[dbKey] = updates[key];
  }

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("channels")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/channels - delete a channel and its models
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Channel id required" }, { status: 400 });

  // Delete models first (FK constraint)
  const { error: modelErr } = await supabase.from("models").delete().eq("channel_id", id);
  if (modelErr) return NextResponse.json({ error: modelErr.message }, { status: 500 });

  // Then delete channel
  const { error: chErr } = await supabase.from("channels").delete().eq("id", id);
  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
