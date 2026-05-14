import { NextRequest, NextResponse } from "next/server";

// Temporary admin endpoint to fix RLS policies
// DELETE after use!

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: Create a temporary SQL execution function
  // We'll use the supabase SQL editor concept - but via REST we can only call RPC functions
  // Let's try a different approach: use the PostgreSQL connection string directly
  
  // Actually, we can use the Supabase Management API with the service role key
  // No, that needs a personal access token.
  
  // Best approach: Use the Supabase pg_net extension to make HTTP requests
  // Or: Direct PostgreSQL connection using pg library
  
  // Let's try creating an RPC function that can execute SQL
  // First, let's check if we can create one using the REST API
  
  // Actually the simplest way: use the database connection directly
  // We need pg package, but it's likely not installed.
  // Let's check what packages are available.
  
  return NextResponse.json({ 
    message: "POST endpoint ready. Need to implement SQL execution.",
    hint: "Install pg package or use Supabase Dashboard SQL Editor"
  });
}

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
  
  const action = req.nextUrl.searchParams.get("action") || "list_policies";

  if (action === "list_policies") {
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

  if (action === "fix_rls") {
    // Strategy: Drop and recreate RLS policies using the Supabase REST API
    // We can't run DDL directly, but we can try to work around it
    
    // The key insight: we need to drop the problematic policies on profiles
    // that reference the profiles table itself (causing infinite recursion)
    
    // Let's try using a Supabase RPC call to execute SQL
    // First, check if there's a useful RPC function
    
    const { data: rpcList, error: rpcError } = await supabase.rpc('exec_sql', { 
      sql_string: "SELECT 1" 
    });
    
    if (rpcError) {
      // No exec_sql function exists. We need to create one in the SQL editor.
      return NextResponse.json({
        status: "needs_manual_sql",
        message: "Cannot execute DDL via REST API. Please run the following SQL in Supabase Dashboard → SQL Editor:",
        sql: [
          "-- ============================================",
          "-- FIX RLS INFINITE RECURSION ON profiles TABLE",
          "-- ============================================",
          "",
          "-- Step 1: Drop ALL existing policies on profiles",
          "DROP POLICY IF EXISTS \"Public profiles are viewable\" ON public.profiles;",
          "DROP POLICY IF EXISTS \"Users can view own profile\" ON public.profiles;",
          "DROP POLICY IF EXISTS \"Users can insert own profile\" ON public.profiles;",
          "DROP POLICY IF EXISTS \"Users can update own profile\" ON public.profiles;",
          "DROP POLICY IF EXISTS \"Admins can do everything\" ON public.profiles;",
          "DROP POLICY IF EXISTS \"Profiles are viewable by everyone\" ON public.profiles;",
          "",
          "-- Step 2: Recreate with non-recursive policies",
          "CREATE POLICY \"Profiles are viewable by everyone\" ON public.profiles",
          "  FOR SELECT USING (true);",
          "",
          "CREATE POLICY \"Users can insert own profile\" ON public.profiles",
          "  FOR INSERT WITH CHECK (auth.uid() = id);",
          "",
          "CREATE POLICY \"Users can update own profile\" ON public.profiles",
          "  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);",
          "",
          "-- Step 3: Drop admin policies on channels/models that reference profiles",
          "DROP POLICY IF EXISTS \"Admins can manage channels\" ON public.channels;",
          "DROP POLICY IF EXISTS \"Admins can manage models\" ON public.models;",
          "DROP POLICY IF EXISTS \"Admins can manage channel_submissions\" ON public.channel_submissions;",
          "",
          "-- Step 4: Recreate admin policies using JWT role (no profiles table lookup)",
          "-- For channels: anyone can SELECT, only service_role can modify",
          "CREATE POLICY \"Anyone can view channels\" ON public.channels FOR SELECT USING (true);",
          "CREATE POLICY \"Service role can modify channels\" ON public.channels FOR ALL",
          "  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');",
          "",
          "-- For models: anyone can SELECT, only service_role can modify",  
          "CREATE POLICY \"Anyone can view models\" ON public.models FOR SELECT USING (true);",
          "CREATE POLICY \"Service role can modify models\" ON public.models FOR ALL",
          "  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');",
          "",
          "-- For channel_submissions: anyone can SELECT, only service_role can modify",
          "CREATE POLICY \"Anyone can view submissions\" ON public.channel_submissions FOR SELECT USING (true);",
          "CREATE POLICY \"Service role can modify submissions\" ON public.channel_submissions FOR ALL",
          "  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');",
        ]
      });
    }
    
    return NextResponse.json({ success: true, data: rpcList });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
