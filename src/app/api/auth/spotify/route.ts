import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback`,
        scopes: "user-read-email user-follow-read user-top-read",
      },
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error("Error signing in with Spotify:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/login?error=AuthError`
    );
  }
}
