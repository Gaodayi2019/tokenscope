import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/stats - lightweight site statistics
export async function GET() {
  try {
    // Use Supabase count queries (efficient, no data transfer)
    const [channelsRes, modelsRes, reviewsRes] = await Promise.all([
      supabase.from("channels").select("id", { count: "exact", head: true }),
      supabase.from("models").select("id", { count: "exact", head: true }),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      channels: channelsRes.count || 0,
      models: modelsRes.count || 0,
      reviews: reviewsRes.count || 0,
      users: 0, // Not available via anon query
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
