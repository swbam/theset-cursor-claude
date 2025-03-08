import { Redis } from "@upstash/redis";

import { env } from "@/env.mjs";

// Initialize Redis client if environment variables are available
let redis: Redis | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 60, // 1 hour
  LONG: 60 * 60 * 24, // 1 day
  WEEK: 60 * 60 * 24 * 7, // 1 week
};

/**
 * Get data from cache or fetch it and store in cache
 */
export async function getWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_DURATIONS.MEDIUM
): Promise<T> {
  // If Redis is not available, just fetch the data
  if (!redis) {
    return fetchFn();
  }

  try {
    // Try to get from cache
    const cachedData = await redis.get(key);

    if (cachedData) {
      return JSON.parse(cachedData as string) as T;
    }

    // If not in cache, fetch the data
    const data = await fetchFn();

    // Store in cache
    await redis.set(key, JSON.stringify(data), { ex: ttl });

    return data;
  } catch (error) {
    console.error("Redis cache error:", error);
    // If there's an error with Redis, fall back to direct fetch
    return fetchFn();
  }
}

/**
 * Invalidate a cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis invalidation error:", error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis pattern invalidation error:", error);
  }
}
