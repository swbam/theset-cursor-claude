import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getAuthSession();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  return session.user;
}

export function getSpotifyToken(session: any) {
  if (!session?.provider_token) {
    return null;
  }

  return session.provider_token;
}
