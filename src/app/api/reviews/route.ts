import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/reviews?channelId=xxx - list reviews for a channel
export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/reviews - submit a review
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { channelId, stability, speed, service, value, content } = body;

  if (!channelId || !content || [stability, speed, service, value].some((v) => !v)) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // For MVP: allow anonymous reviews with a generated user
  // In production: require auth header, get user from JWT
  const authHeader = req.headers.get("authorization");
  let userId = "anonymous";
  let username = "Anonymous";

  if (authHeader) {
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await anonSupabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await anonSupabase.from("profiles").select("display_name").eq("id", user.id).single();
      username = profile?.display_name || user.email?.split("@")[0] || "User";
    }
  }

  const { error } = await supabase.from("reviews").insert({
    channel_id: channelId,
    user_id: userId,
    username,
    rating_stability: stability,
    rating_speed: speed,
    rating_service: service,
    rating_value: value,
    content,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate channel average ratings
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating_stability, rating_speed, rating_service, rating_value")
    .eq("channel_id", channelId);

  if (reviews && reviews.length > 0) {
    const n = reviews.length;
    const avgS = reviews.reduce((a, r) => a + r.rating_stability, 0) / n;
    const avgSp = reviews.reduce((a, r) => a + r.rating_speed, 0) / n;
    const avgSe = reviews.reduce((a, r) => a + r.rating_service, 0) / n;
    const avgV = reviews.reduce((a, r) => a + r.rating_value, 0) / n;
    const avgO = (avgS + avgSp + avgSe + avgV) / 4;

    await supabase
      .from("channels")
      .update({
        rating_overall: Math.round(avgO * 10) / 10,
        rating_stability: Math.round(avgS * 10) / 10,
        rating_speed: Math.round(avgSp * 10) / 10,
        rating_service: Math.round(avgSe * 10) / 10,
        rating_value: Math.round(avgV * 10) / 10,
        rating_count: n,
        review_count: n,
      })
      .eq("id", channelId);
  }

  return NextResponse.json({ success: true });
}
