"use server";

// Import sql for raw SQL queries
import { sql } from "drizzle-orm";
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

    // Create the database client with schema
    const db = drizzle(migrationClient, { schema });

    console.log("📊 Checking for existing tables...");
    try {
      // Check if artists table exists
      const artistsTableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'artists'
        );
      `);
      console.log("Artist table check result:", artistsTableCheck);
    } catch (error) {
      console.log("Error checking for artists table:", error);
    }

    console.log("📂 Running migrations from folder: src/lib/db/migrations");
    await migrate(db, {
      migrationsFolder: "src/lib/db/migrations",
    });

    console.log("✅ Migrations completed successfully");

    // Create some sample data for testing
    console.log("🔄 Creating sample data for testing...");
    try {
      // Sample artist
      const artistsResult = await db
        .insert(schema.artists)
        .values({
          id: "1",
          name: "Arctic Monkeys",
          image:
            "https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f",
          type: "artist",
          url: "https://open.spotify.com/artist/7Ln80lUS6He07XvHI8qqHH",
          popularity: 82,
          genres: ["indie rock", "modern rock", "rock", "garage rock"],
        })
        .onConflictDoNothing()
        .returning();
      console.log("✅ Added sample artist:", artistsResult);

      // Sample venue
      const venuesResult = await db
        .insert(schema.venues)
        .values({
          id: "1",
          name: "Madison Square Garden",
          city: "New York",
          address: "4 Pennsylvania Plaza, New York, NY 10001",
          latitude: 40.7505,
          longitude: -73.9934,
          capacity: 20000,
        })
        .onConflictDoNothing()
        .returning();
      console.log("✅ Added sample venue:", venuesResult);

      // Sample show
      const showsResult = await db
        .insert(schema.shows)
        .values({
          id: "1",
          title: "Arctic Monkeys: World Tour 2023",
          date: new Date("2023-10-15"),
          artist_id: "1",
          venue_id: "1",
          image_url:
            "https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f",
          min_price: 45,
          max_price: 250,
          ticket_url: "https://example.com/tickets/1",
        })
        .onConflictDoNothing()
        .returning();
      console.log("✅ Added sample show:", showsResult);
    } catch (error) {
      console.error("❌ Error creating sample data:", error);
    }

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
