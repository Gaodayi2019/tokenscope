import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/models?channel_id=xxx - list models for a channel
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channel_id");

  if (!channelId) {
    return NextResponse.json({ error: "channel_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("channel_id", channelId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/admin/models - update a model
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Model id required" }, { status: 400 });

  const fieldMap: Record<string, string> = {
    name: "name",
    category: "category",
    inputPricePer1M: "input_price_per_1m",
    outputPricePer1M: "output_price_per_1m",
    isFree: "is_free",
    freeQuota: "free_quota",
    contextWindow: "context_window",
  };

  const dbUpdates: Record<string, any> = {};
  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) dbUpdates[dbKey] = updates[key];
  }

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("models")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/models?id=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Model id required" }, { status: 400 });

  const { error } = await supabase.from("models").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
