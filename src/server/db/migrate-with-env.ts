import { resolve } from "path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema";

// Load environment variables from .env file
config({ path: resolve(process.cwd(), ".env") });

// This script runs migrations on the database
async function main() {
  console.log("Running migrations...");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a PostgreSQL connection
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient, { schema });

  try {
    await migrate(db, { migrationsFolder: "src/lib/db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
