import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/submissions - list pending submissions
export async function GET() {
  const { data, error } = await supabase
    .from("channel_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/admin/submissions - approve or reject
export async function PATCH(req: NextRequest) {
  const { id, action } = await req.json(); // action: "approve" | "reject"

  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  if (action === "reject") {
    await supabase.from("channel_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ success: true, action: "rejected" });
  }

  if (action === "approve") {
    // Fetch the submission
    const { data: sub } = await supabase.from("channel_submissions").select("*").eq("id", id).single();
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // Create the channel
    const { error: insertErr } = await supabase.from("channels").insert({
      name: sub.name,
      type: sub.type,
      description: sub.description,
      description_en: sub.description,
      url: sub.url,
      doc_url: sub.doc_url,
      status: "unknown",
      cert_level: "none",
    });

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Mark submission as approved
    await supabase.from("channel_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);

    return NextResponse.json({ success: true, action: "approved" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
