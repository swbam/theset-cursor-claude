import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";

import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { favorites, users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations";

export const authConfig: NextAuthConfig = {
  providers: [
    Spotify({
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user-read-email user-top-read user-follow-read",
        },
      },
    }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHub({
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
    }),
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedCredentials = loginSchema.safeParse(credentials);

        if (!validatedCredentials.success) {
          return null;
        }

        const { email, password } = validatedCredentials.data;

        // Simplified auth for now - just check if user exists
        try {
          const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, email),
          });

          if (!user) {
            return null;
          }

          // In a real app, you would check the password here
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Error authenticating user:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  adapter: DrizzleAdapter(db, {
    usersTableName: "users",
    accountsTableName: "accounts",
    sessionsTableName: "sessions",
    verificationTokensTableName: "verification_tokens",
  }),
};
