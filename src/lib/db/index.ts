// This file should only be imported on the server side
// Do NOT import this in client components

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Try to get environment variables, providing fallbacks for development
const getDatabaseUrl = () => {
  // If DATABASE_URL is missing, provide a warning and use a fallback for development
  if (!process.env.DATABASE_URL) {
    console.warn(
      "⚠️ DATABASE_URL is not defined in server component. Using a mock connection string for development."
    );
    return "postgres://postgres:postgres@localhost:5432/theset_dev";
  }
  return process.env.DATABASE_URL;
};

// Database connection is only created on the server
const connectionString = getDatabaseUrl();
// For debugging in development
if (process.env.NODE_ENV !== "production") {
  console.log(
    `🔌 Server DB connection to: ${connectionString.split("@").pop()}`
  );
}

// Connect to the database
const client = postgres(connectionString, { max: 5 });

// Create the database client with schema
export const db = drizzle(client, { schema });

// Export schema
export * from "./schema";
