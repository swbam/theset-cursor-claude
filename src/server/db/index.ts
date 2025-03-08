// Add this at the top
import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Create a PostgreSQL connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For query purposes (connection pooling)
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations (single connection)
export const migrationClient = postgres(connectionString, { max: 1 });
