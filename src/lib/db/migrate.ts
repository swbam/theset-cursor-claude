"use server";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@/env.mjs";

/**
 * Run database migrations
 * This function should only be called from the server
 */
export async function runMigrations() {
  console.log("Running migrations...");

  const connectionString = env.DATABASE_URL;
  const migrationClient = postgres(connectionString, { max: 1 });

  try {
    await migrate(drizzle(migrationClient), {
      migrationsFolder: "./src/lib/db/migrations",
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Only run this if executed directly (not imported)
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}
