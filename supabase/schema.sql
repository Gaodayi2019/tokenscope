-- ============================================================
-- TokenScope - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Channels Table ──────────────────────────────────
CREATE TABLE public.channels (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('relay','proxy','free-model','direct','hosting')),
  description   TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  url           TEXT NOT NULL,
  doc_url       TEXT,
  status        TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online','offline','unstable','unknown')),
  cert_level    TEXT NOT NULL DEFAULT 'none' CHECK (cert_level IN ('none','verified','premium')),
  region        TEXT[] NOT NULL DEFAULT '{}',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  tags_en       TEXT[] NOT NULL DEFAULT '{}',
  payment_methods TEXT[] NOT NULL DEFAULT '{}',

  -- Free tier
  free_tier_available      BOOLEAN NOT NULL DEFAULT FALSE,
  free_tier_description    TEXT,
  free_tier_description_en TEXT,

  -- Stats
  avg_latency          INTEGER NOT NULL DEFAULT 0,
  uptime_30d           REAL NOT NULL DEFAULT 0,
  review_count         INTEGER NOT NULL DEFAULT 0,
  monthly_active_users INTEGER,

  -- Ratings (0.0 - 5.0)
  rating_overall   REAL NOT NULL DEFAULT 0 CHECK (rating_overall BETWEEN 0 AND 5),
  rating_stability REAL NOT NULL DEFAULT 0 CHECK (rating_stability BETWEEN 0 AND 5),
  rating_speed     REAL NOT NULL DEFAULT 0 CHECK (rating_speed BETWEEN 0 AND 5),
  rating_service   REAL NOT NULL DEFAULT 0 CHECK (rating_service BETWEEN 0 AND 5),
  rating_value     REAL NOT NULL DEFAULT 0 CHECK (rating_value BETWEEN 0 AND 5),
  rating_count     INTEGER NOT NULL DEFAULT 0,

  featured   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channels_type ON public.channels(type);
CREATE INDEX idx_channels_status ON public.channels(status);
CREATE INDEX idx_channels_featured ON public.channels(featured) WHERE featured = TRUE;
CREATE INDEX idx_channels_rating ON public.channels(rating_overall DESC);

-- ── Models Table ────────────────────────────────────
CREATE TABLE public.models (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id         UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN ('chat','code','vision','embedding','image','audio','reasoning')),
  input_price_per_1m  REAL,
  output_price_per_1m REAL,
  is_free            BOOLEAN NOT NULL DEFAULT FALSE,
  free_quota         TEXT,
  context_window     INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_models_channel ON public.models(channel_id);
CREATE INDEX idx_models_category ON public.models(category);
CREATE INDEX idx_models_free ON public.models(is_free) WHERE is_free = TRUE;

-- ── Reviews Table ───────────────────────────────────
CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id      UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  avatar          TEXT,
  rating_stability REAL NOT NULL CHECK (rating_stability BETWEEN 0 AND 5),
  rating_speed     REAL NOT NULL CHECK (rating_speed BETWEEN 0 AND 5),
  rating_service   REAL NOT NULL CHECK (rating_service BETWEEN 0 AND 5),
  rating_value     REAL NOT NULL CHECK (rating_value BETWEEN 0 AND 5),
  content          TEXT NOT NULL,
  helpful          INTEGER NOT NULL DEFAULT 0,
  verified         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_channel ON public.reviews(channel_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

-- ── User Profiles Table ─────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security (RLS) ────────────────────────

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Channels: anyone can read, only admin can write
CREATE POLICY "channels_read" ON public.channels FOR SELECT USING (TRUE);
CREATE POLICY "channels_admin_write" ON public.channels FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Models: anyone can read, only admin can write
CREATE POLICY "models_read" ON public.models FOR SELECT USING (TRUE);
CREATE POLICY "models_admin_write" ON public.models FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Reviews: anyone can read, users can insert their own, users can update/delete their own
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_own" ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "reviews_own_delete" ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles: users can read own profile, admin can read all, users can update own
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Auto-create profile on signup ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Updated_at trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
