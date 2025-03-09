"use server";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env.mjs";
import * as schema from "./schema";

// Create a PostgreSQL connection
const connectionString = env.DATABASE_URL;

// For query purposes (connection pooling)
const queryClient = postgres(connectionString, {
  max: 10,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });

// Export schema
export * from "./schema";
