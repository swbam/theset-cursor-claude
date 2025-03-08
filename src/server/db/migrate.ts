import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, migrationClient } from ".";

// This script runs migrations on the database
async function main() {
  console.log("Running migrations...");

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
