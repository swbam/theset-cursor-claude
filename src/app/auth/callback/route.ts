import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { storeUserSpotifyData } from "@/lib/api/spotify";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=NoCode`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    // Store user's Spotify data
    if (data.user) {
      await storeUserSpotifyData(data.user.id);
    }

    // Redirect to home page
    return NextResponse.redirect(`${requestUrl.origin}/`);
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=AuthCallbackError`
    );
  }
}
