import { NextRequest, NextResponse } from "next/server";

// Temporary admin endpoint to inspect and fix RLS policies
// DELETE after use!

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use Supabase RPC to query pg_policies
  // We'll create a function first if it doesn't exist
  const action = req.nextUrl.searchParams.get("action") || "list_policies";

  if (action === "list_policies") {
    // Query RLS policies via Supabase's built-in query capability
    // We need to use raw SQL - Supabase REST doesn't support this directly
    // But we can try the pg_policies view through a workaround
    
    // Actually, let's just check which tables have RLS enabled and what policies exist
    // by querying the information_schema
    
    // First, let's try to see if we can query using the supabase client
    // The service_role key bypasses RLS, so we can at least verify that
    
    // Let's list all policies by trying to read them
    // Unfortunately, pg_policies is not accessible via REST API
    
    // Instead, let's just test the anon key against each table
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey);
    
    const tables = ["channels", "models", "profiles", "channel_submissions", "reviews", "uptime_checks", "review_votes"];
    const results: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await anonClient.from(table).select("id").limit(1);
        results[table] = error ? { error: error.code, message: error.message } : { ok: true, count: data?.length || 0 };
      } catch (e: any) {
        results[table] = { error: "exception", message: e.message };
      }
    }
    
    return NextResponse.json({ anon_key_test: results });
  }

  if (action === "fix_profiles_rls") {
    // Drop all existing RLS policies on profiles and recreate with non-recursive ones
    // We need to use SQL for this. Let's try using supabase.rpc if any function exists,
    // or we'll need to use the Supabase SQL editor.
    
    // Since we can't execute DDL via REST API, return instructions
    return NextResponse.json({
      message: "Cannot execute DDL via REST API. Need to run SQL in Supabase Dashboard.",
      sql_to_run: [
        "-- Step 1: Drop existing policies on profiles",
        "DROP POLICY IF EXISTS \"Profiles are viewable by everyone\" ON public.profiles;",
        "DROP POLICY IF EXISTS \"Users can insert own profile\" ON public.profiles;",
        "DROP POLICY IF EXISTS \"Users can update own profile\" ON public.profiles;",
        "DROP POLICY IF EXISTS \"Admins can do everything\" ON public.profiles;",
        "DROP POLICY IF EXISTS \"Users can view own profile\" ON public.profiles;",
        "DROP POLICY IF EXISTS \"Public profiles are viewable\" ON public.profiles;",
        "",
        "-- Step 2: Create non-recursive policies",
        "-- SELECT: anyone can view profiles (no self-reference)",
        "CREATE POLICY \"Profiles are viewable by everyone\" ON public.profiles FOR SELECT USING (true);",
        "",
        "-- INSERT: users can insert their own profile",
        "CREATE POLICY \"Users can insert own profile\" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);",
        "",
        "-- UPDATE: users can update their own profile",
        "CREATE POLICY \"Users can update own profile\" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);",
        "",
        "-- Also fix channels/models RLS if they reference profiles",
        "-- Drop admin-only policies that cause recursion",
        "DROP POLICY IF EXISTS \"Admins can manage channels\" ON public.channels;",
        "DROP POLICY IF EXISTS \"Admins can manage models\" ON public.models;",
        "DROP POLICY IF EXISTS \"Admins can manage channel_submissions\" ON public.channel_submissions;",
        "",
        "-- Recreate with simple rules (admin check via JWT claim, not profiles table)",
        "CREATE POLICY \"Anyone can view channels\" ON public.channels FOR SELECT USING (true);",
        "CREATE POLICY \"Admins can manage channels\" ON public.channels FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');",
        "",
        "CREATE POLICY \"Anyone can view models\" ON public.models FOR SELECT USING (true);",
        "CREATE POLICY \"Admins can manage models\" ON public.models FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');",
        "",
        "CREATE POLICY \"Anyone can view channel_submissions\" ON public.channel_submissions FOR SELECT USING (true);",
        "CREATE POLICY \"Admins can manage channel_submissions\" ON public.channel_submissions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');",
      ]
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
