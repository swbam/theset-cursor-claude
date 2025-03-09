"use server";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema";

// Try to get environment variables, providing fallbacks for development
const getDatabaseUrl = () => {
  // If DATABASE_URL is missing, provide a warning and use a fallback for development
  if (!process.env.DATABASE_URL) {
    console.warn(
      "⚠️ DATABASE_URL is not defined. Using a mock connection string for development."
    );
    return "postgres://postgres:postgres@localhost:5432/theset_dev";
  }
  return process.env.DATABASE_URL;
};

/**
 * Run database migrations
 */
export async function runMigrations() {
  console.log("🔄 Running migrations...");

  try {
    const connectionString = getDatabaseUrl();
    console.log(
      `🔌 Connecting to database: ${connectionString.split("@").pop()}`
    );

    const migrationClient = postgres(connectionString, { max: 1 });

    await migrate(drizzle(migrationClient), {
      migrationsFolder: "src/lib/db/migrations",
    });

    console.log("✅ Migrations completed successfully");

    // Close the client
    await migrationClient.end();

    return { success: true };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return { success: false, error };
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === import.meta.url) {
  runMigrations()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Unexpected error during migration:", error);
      process.exit(1);
    });
}
