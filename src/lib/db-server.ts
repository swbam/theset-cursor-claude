"use server";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env.mjs";
import * as schema from "./db/schema";

// This function only runs on the server
export async function createServerOnlyDb() {
  const connectionString = env.DATABASE_URL;
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
  });
  return drizzle(client, { schema });
}

// Helper function to perform database queries on the server
export async function performDbQuery<T>(
  queryFn: (db: ReturnType<typeof createServerOnlyDb>) => Promise<T>
): Promise<T> {
  const db = await createServerOnlyDb();
  return queryFn(db);
}
