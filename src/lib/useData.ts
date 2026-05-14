"use client";

import { useState, useEffect, useCallback } from "react";
import type { Channel } from "@/types";
import { channels as staticChannels, siteStats as staticSiteStats } from "@/data/channels";

// ── Types ─────────────────────────────────────

export interface SiteStats {
  channels: number;
  models: number;
  reviews: number;
  users: number;
}

interface UseChannelsResult {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseChannelResult {
  channel: Channel | null;
  loading: boolean;
  error: string | null;
}

interface UseSiteStatsResult {
  stats: SiteStats;
  loading: boolean;
}

// ── Helper: try Supabase, fallback to static ──

async function fetchChannelsFromDB(filters?: {
  type?: string;
  region?: string;
  freeOnly?: boolean;
  search?: string;
  sortBy?: string;
}): Promise<Channel[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.region) params.set("region", filters.region);
    if (filters?.freeOnly) params.set("freeOnly", "true");
    if (filters?.search) params.set("search", filters.search);
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);

    const res = await fetch(`/api/channels?${params.toString()}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    
    // Support both old array format and new { channels, total } format
    const channels = Array.isArray(data) ? data : (data.channels || []);
    if (channels.length > 0) return channels;
    throw new Error("empty");
  } catch {
    // Fallback to static data
    let result = [...staticChannels];
    if (filters?.type) result = result.filter((c) => c.type === filters.type);
    if (filters?.region) result = result.filter((c) => c.region.includes(filters.region as any));
    if (filters?.freeOnly) result = result.filter((c) => c.freeTier?.available || c.type === "free-model");
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters?.sortBy === "rating") result.sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (filters?.sortBy === "price-low") result.sort((a, b) => {
      const pa = Math.min(...a.models.filter((m) => m.inputPricePer1M != null).map((m) => m.inputPricePer1M!));
      const pb = Math.min(...b.models.filter((m) => m.inputPricePer1M != null).map((m) => m.inputPricePer1M!));
      return pa - pb;
    });
    if (filters?.sortBy === "latency") result.sort((a, b) => a.stats.avgLatency - b.stats.avgLatency);
    if (filters?.sortBy === "reviews") result.sort((a, b) => b.ratings.count - a.ratings.count);
    if (filters?.sortBy === "newest") result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }
}

async function fetchChannelById(id: string): Promise<Channel | null> {
  try {
    const res = await fetch(`/api/channels/${id}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    if (data && data.id) return data;
    throw new Error("empty");
  } catch {
    return staticChannels.find((c) => c.id === id) || null;
  }
}

async function fetchSiteStats(): Promise<SiteStats> {
  try {
    // Use lightweight stats endpoint
    const res = await fetch("/api/stats");
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    throw new Error("stats API error");
  } catch {
    // Fallback: count from channels API
    try {
      const res = await fetch("/api/channels?limit=1");
      if (res.ok) {
        const data = await res.json();
        const channels = Array.isArray(data) ? data : (data.channels || []);
        const total = Array.isArray(data) ? data.length : (data.total || 0);
        return {
          channels: total,
          models: channels.reduce((sum: number, ch: Channel) => sum + (ch.models?.length || 0), 0),
          reviews: channels.reduce((sum: number, ch: Channel) => sum + (ch.ratings?.count || 0), 0),
          users: staticSiteStats.users,
        };
      }
    } catch {}
    return staticSiteStats;
  }
}

// ── Hooks ─────────────────────────────────────

/** Fetch channel list with optional filters */
export function useChannels(filters?: {
  type?: string;
  region?: string;
  freeOnly?: boolean;
  search?: string;
  sortBy?: string;
}): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChannelsFromDB(filters);
      setChannels(data);
    } catch (e: any) {
      setError(e.message);
      setChannels(staticChannels);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.region, filters?.freeOnly, filters?.search, filters?.sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { channels, loading, error, refetch: fetchData };
}

/** Fetch a single channel by ID */
export function useChannel(id: string): UseChannelResult {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchChannelById(id).then((data) => {
      if (!cancelled) {
        setChannel(data);
        setLoading(false);
      }
    }).catch((e: any) => {
      if (!cancelled) {
        setError(e.message);
        setChannel(staticChannels.find((c) => c.id === id) || null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [id]);

  return { channel, loading, error };
}

/** Fetch site statistics */
export function useSiteStats(): UseSiteStatsResult {
  const [stats, setStats] = useState<SiteStats>(staticSiteStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}
