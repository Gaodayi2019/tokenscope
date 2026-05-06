-- TokenScope Uptime Monitor - Supabase Edge Function
-- Deploy this as a Supabase Edge Function manually
-- File name: check-uptime/index.ts
-- Deploy with: supabase functions deploy check-uptime

-- ===== PASTE THIS CODE INTO SUPABASE EDGE FUNCTION EDITOR =====

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Fetch all channels
  const channelsRes = await fetch(`${supabaseUrl}/rest/v1/channels?select=id,url`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const channels = await channelsRes.json();

  const results: Array<{ id: string; status: string; latency: number; statusCode: number | null; error: string | null }> = [];

  const batchSize = 10;
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    const checks = await Promise.allSettled(
      batch.map(async (ch: { id: string; url: string }) => {
        const start = Date.now();
        try {
          const checkUrl = ch.url.replace(/\/$/, "") + "/v1/models";
          const res = await fetch(checkUrl, {
            method: "GET",
            signal: AbortSignal.timeout(10000),
          });
          const latency = Date.now() - start;
          return { id: ch.id, status: res.ok ? "online" : "degraded", latency, statusCode: res.status, error: null };
        } catch (err: any) {
          return { id: ch.id, status: "offline", latency: Date.now() - start, statusCode: null, error: err.message?.slice(0, 200) || "timeout" };
        }
      })
    );
    for (const check of checks) {
      if (check.status === "fulfilled") results.push(check.value);
    }
  }

  if (results.length > 0) {
    const rows = results.map((r) => ({
      channel_id: r.id, status: r.status, latency_ms: r.latency,
      status_code: r.statusCode, error: r.error,
    }));
    await fetch(`${supabaseUrl}/rest/v1/uptime_checks`, {
      method: "POST",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  return new Response(JSON.stringify({ checked: results.length }), { headers: { "Content-Type": "application/json" } });
});

-- ===== SCHEDULE WITH pg_cron (run in SQL Editor) =====
-- Every 15 minutes:

-- First enable pg_cron extension:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then schedule:
-- SELECT cron.schedule(
--   'check-uptime',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://zauigbzypcjqyjhgorvp.supabase.co/functions/v1/check-uptime',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
