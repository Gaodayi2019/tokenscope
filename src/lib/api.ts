import { supabase } from "./supabase";
import type { Channel, ModelInfo } from "@/types";
// @ts-ignore — loosen types for insert operations
const db: any = supabase;

// ── Channels ──────────────────────────────────

export async function getChannels(filters?: {
  type?: string;
  region?: string;
  freeOnly?: boolean;
  search?: string;
  sortBy?: string;
}) {
  let query = db.from("channels").select("*, models(*)").order("rating_overall", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.region) query = query.contains("region", [filters.region]);
  if (filters?.freeOnly) query = query.eq("free_tier_available", true);
  if (filters?.search) query = query.textSearch("name", filters.search);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapChannelRow);
}

export async function getChannelById(id: string) {
  const { data, error } = await supabase
    .from("channels")
    .select("*, models(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapChannelRow(data);
}

export async function getFeaturedChannels(limit = 6) {
  const { data, error } = await supabase
    .from("channels")
    .select("*, models(*)")
    .eq("featured", true)
    .order("rating_overall", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapChannelRow);
}

// ── Models ────────────────────────────────────

export async function getFreeModels() {
  const { data, error } = await supabase
    .from("models")
    .select("*, channels(id, name, url, type)")
    .or("is_free.eq.true,channels.type.eq.free-model")
    .order("name");
  if (error) throw error;
  return data || [];
}

// ── Reviews ───────────────────────────────────

export async function getReviews(channelId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createReview(review: {
  channelId: string;
  ratings: { stability: number; speed: number; service: number; value: number };
  content: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await db.from("reviews").insert({
    channel_id: review.channelId,
    user_id: user.id,
    username: user.user_metadata?.display_name || user.email?.split("@")[0] || "Anonymous",
    rating_stability: review.ratings.stability,
    rating_speed: review.ratings.speed,
    rating_service: review.ratings.service,
    rating_value: review.ratings.value,
    content: review.content,
  }).select().single();
  if (error) throw error;
  return data;
}

// ── Auth ──────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function signInWithProvider(provider: "github" | "google") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function resendVerification(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await db.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

// ── Mapper: DB row �?Channel type ─────────────

function mapChannelRow(row: any): Channel {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    descriptionEn: row.description_en,
    url: row.url,
    docUrl: row.doc_url,
    status: row.status,
    certLevel: row.cert_level,
    region: row.region,
    tags: row.tags,
    tagsEn: row.tags_en,
    models: (row.models || []).map(mapModelRow),
    paymentMethods: row.payment_methods,
    ratings: {
      overall: row.rating_overall,
      stability: row.rating_stability,
      speed: row.rating_speed,
      service: row.rating_service,
      value: row.rating_value,
      count: row.rating_count,
    },
    stats: {
      avgLatency: row.avg_latency,
      uptime30d: row.uptime_30d,
      reviewCount: row.review_count,
      monthlyActiveUsers: row.monthly_active_users,
    },
    freeTier: row.free_tier_available
      ? { available: true, description: row.free_tier_description || "", descriptionEn: row.free_tier_description_en || "" }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    featured: row.featured,
  };
}

function mapModelRow(row: any): ModelInfo {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    inputPricePer1M: row.input_price_per_1m,
    outputPricePer1M: row.output_price_per_1m,
    isFree: row.is_free,
    freeQuota: row.free_quota,
    contextWindow: row.context_window,
  };
}
