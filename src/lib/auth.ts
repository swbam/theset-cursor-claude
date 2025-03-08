import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import type { User } from "@supabase/supabase-js";
import type { Adapter } from "next-auth/adapters";

import { authConfig } from "@/config/auth";
import { env } from "@/env.mjs";
import { db } from "./db";
import { users } from "./db/schema";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db) as Adapter,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    newUser: "/signup",
  },

  events: {
    linkAccount: async ({ user }) => {
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id!));
    },
  },

  callbacks: {
    jwt: async ({ token }) => {
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, token.sub!),
      });

      if (user) {
        const { id, name, email, username, image: picture } = user;

        token = {
          ...token,
          id,
          name,
          email,
          username,
          picture,
        };
      }

      return token;
    },

    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        const { id, name, email, username, picture: image } = token;

        session.user = {
          ...session.user,
          id,
          name,
          email,
          username,
          image,
        };
      }

      return session;
    },
  },
});

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export async function getUser() {
  const session = await getAuthSession();
  return session?.user || null;
}

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};

// Create Supabase client
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get current session & user
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return data.user;
}

// Sign in with Spotify
export async function signInWithSpotify() {
  return supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      scopes: "user-read-email user-follow-read user-top-read",
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// Get Spotify access token from session
export function getSpotifyToken(session: any) {
  if (!session?.provider_token) {
    return null;
  }
  return session.provider_token;
}

export async function getAuthSession() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  return session.user;
}
