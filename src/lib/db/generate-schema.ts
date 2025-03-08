import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema";

// This script generates the database schema
async function main() {
  console.log("Generating database schema...");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a single connection for migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient, { schema });

  try {
    // Run migrations
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Schema generation completed successfully");
  } catch (error) {
    console.error("Error generating schema:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
