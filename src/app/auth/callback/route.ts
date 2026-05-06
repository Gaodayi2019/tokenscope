import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  if (error) {
    // OAuth provider returned an error
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth code exchange failed:", exchangeError.message);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`);
  }

  // No code parameter — invalid callback
  return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
}
