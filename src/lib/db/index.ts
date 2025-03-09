// Add this at the top
import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@/env.mjs";

// Conditionally import schemas to avoid Node.js imports on the client
const schema =
  typeof window === "undefined" ?
    require("./schema")
  : require("./schema-client");

// This is needed because in development we're running both client and server code
// and we only want to connect to the database on the server
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDatabase> | undefined;
};

function createDatabase() {
  if (typeof window !== "undefined") {
    // Return mock Drizzle client for client-side
    return {
      query: {} as any,
      select: () => ({ from: () => [] }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({
        set: () => ({ where: () => ({ returning: () => [] }) }),
      }),
      delete: () => ({ where: () => ({ returning: () => [] }) }),
      ...schema,
    };
  }

  // Connect to database on server-side
  const connectionString = env.DATABASE_URL;
  // Server-only code - safe to use Node.js modules
  const client = postgres(connectionString, {
    max: 10,
    prepare: false,
  });
  return drizzle(client, { schema });
}

// Create database client
export const db = globalForDb.db ?? createDatabase();

// This ensures we reuse the connection in development
if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

// Server-only function to run migrations
export async function runMigrations() {
  if (typeof window !== "undefined") {
    throw new Error("Cannot run migrations on the client");
  }

  const connectionString = env.DATABASE_URL;
  const migrationClient = postgres(connectionString, { max: 1 });
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./src/lib/db/migrations",
  });
  await migrationClient.end();
}

// Re-export schema
export * from "./schema";
