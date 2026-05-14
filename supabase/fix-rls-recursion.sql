-- ============================================================
-- TokenScope — Fix RLS Infinite Recursion
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- Root cause: profiles SELECT policy references profiles table itself,
-- and channels/models/channel_submissions admin policies reference profiles.
-- When using anon key, this creates infinite recursion (42P17 error).
-- ============================================================

-- Step 1: Fix profiles — remove self-referencing admin check
-- Old policy: USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
-- The subquery on profiles triggers the same policy again → infinite recursion

-- Drop the recursive SELECT policy on profiles
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;

-- Create a simple non-recursive policy: anyone can view profiles
-- (profile data is non-sensitive: display_name, avatar, role)
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT USING (true);

-- Step 2: Fix channels — replace admin policy that references profiles
-- Old: USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
-- New: use JWT role claim (service_role bypasses RLS, anon doesn't match)
DROP POLICY IF EXISTS "channels_admin_write" ON public.channels;

-- Split into per-operation policies for clarity
CREATE POLICY "channels_insert_service_role" ON public.channels
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "channels_update_service_role" ON public.channels
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "channels_delete_service_role" ON public.channels
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 3: Fix models — same pattern as channels
DROP POLICY IF EXISTS "models_admin_write" ON public.models;

CREATE POLICY "models_insert_service_role" ON public.models
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "models_update_service_role" ON public.models
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "models_delete_service_role" ON public.models
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 4: Fix channel_submissions — replace admin policy
DROP POLICY IF EXISTS "submissions_admin" ON public.channel_submissions;

CREATE POLICY "submissions_insert_service_role" ON public.channel_submissions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "submissions_update_service_role" ON public.channel_submissions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "submissions_delete_service_role" ON public.channel_submissions
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- Verification: After running, test with anon key:
--   SELECT * FROM channels LIMIT 1;  -- should work now
--   SELECT * FROM profiles LIMIT 1;  -- should work now
-- ============================================================
