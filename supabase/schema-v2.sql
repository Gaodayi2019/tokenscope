-- TokenScope - Additional Tables for Submissions, Reviews, and Monitoring
-- Run in Supabase SQL Editor

-- ── Channel Submissions (pending admin approval) ────
CREATE TABLE public.channel_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('relay','proxy','free-model','direct','hosting')),
  description   TEXT NOT NULL DEFAULT '',
  url           TEXT NOT NULL,
  doc_url       TEXT,
  submitter_email TEXT,
  submitter_note   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   UUID REFERENCES auth.users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON public.channel_submissions(status);

-- RLS: anyone can insert, only admin can read/manage
ALTER TABLE public.channel_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_insert" ON public.channel_submissions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "submissions_admin" ON public.channel_submissions FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ── Uptime Checks ───────────────────────────────────
CREATE TABLE public.uptime_checks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id  UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('online','offline','degraded')),
  latency_ms  INTEGER,
  status_code INTEGER,
  error       TEXT,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uptime_channel ON public.uptime_checks(channel_id);
CREATE INDEX idx_uptime_time ON public.uptime_checks(checked_at DESC);

-- RLS: anyone can read, only service_role can write (edge function)
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uptime_read" ON public.uptime_checks FOR SELECT USING (TRUE);

-- ── Auto-update channel status from latest uptime check ──
CREATE OR REPLACE FUNCTION public.update_channel_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.channels
  SET
    status = CASE
      WHEN NEW.status = 'online' THEN 'online'
      WHEN NEW.status = 'offline' THEN 'offline'
      WHEN NEW.status = 'degraded' THEN 'unstable'
    END,
    avg_latency = NEW.latency_ms,
    updated_at = NOW()
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_uptime_check
  AFTER INSERT ON public.uptime_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_channel_status();

-- ── Helpful vote on reviews ─────────────────────────
CREATE TABLE public.review_votes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read" ON public.review_votes FOR SELECT USING (TRUE);
CREATE POLICY "votes_insert" ON public.review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_delete_own" ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);
