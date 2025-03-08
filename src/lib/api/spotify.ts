import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { env } from "@/env.mjs";
import { getCurrentUser, getSession } from "@/lib/auth";
import { getSpotifyToken } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  artists,
  topTracks,
  userFollowedArtists,
  userTopArtists,
} from "@/lib/db/schema";
import { CACHE_DURATIONS, getWithCache } from "@/lib/redis";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Basic Spotify API call function with caching
async function spotifyApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getSpotifyToken({});

  if (!token) {
    throw new Error("No Spotify token available");
  }

  const url = `https://api.spotify.com/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Type definitions for Spotify API responses
export interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  followers: {
    total: number;
  };
  images: { url: string; height: number; width: number }[];
  genres: string[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtistResponse {
  artists: {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  preview_url: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTracksResponse {
  tracks: SpotifyTrack[];
}

// Cached API calls
export const searchArtists = cache(
  async (query: string): Promise<SpotifyArtistResponse> => {
    return getWithCache(
      `spotify:search:${query}`,
      () =>
        spotifyApiCall<SpotifyArtistResponse>(
          `/search?q=${encodeURIComponent(query)}&type=artist&limit=20`
        ),
      CACHE_DURATIONS.SHORT // Cache for 5 minutes
    );
  }
);

export const getArtistById = cache(
  async (id: string): Promise<SpotifyArtist | null> => {
    try {
      return getWithCache(
        `spotify:artist:${id}`,
        () => spotifyApiCall<SpotifyArtist>(`/artists/${id}`),
        CACHE_DURATIONS.MEDIUM // Cache for 1 hour
      );
    } catch (error) {
      console.error("Error fetching artist:", error);
      return null;
    }
  }
);

export const getArtistTopTracks = cache(
  async (id: string): Promise<SpotifyTrack[]> => {
    return getWithCache(
      `spotify:artist:${id}:top-tracks`,
      async () => {
        const response = await spotifyApiCall<SpotifyTracksResponse>(
          `/artists/${id}/top-tracks?market=US`
        );
        return response.tracks;
      },
      CACHE_DURATIONS.MEDIUM // Cache for 1 hour
    );
  }
);

export const getUserFollowedArtists = cache(
  async (): Promise<SpotifyArtist[]> => {
    const response = await spotifyApiCall<{
      artists: { items: SpotifyArtist[] };
    }>(`/me/following?type=artist&limit=50`);

    return response.artists.items;
  }
);

export const getUserTopArtists = cache(async (): Promise<SpotifyArtist[]> => {
  const response = await spotifyApiCall<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=medium_term&limit=50`
  );

  return response.items;
});

// Store user's Spotify data in Supabase
export async function storeUserSpotifyData(userId: string) {
  try {
    // Fetch user's followed artists and top artists from Spotify
    const [followedArtists, topArtistsList] = await Promise.all([
      getUserFollowedArtists(),
      getUserTopArtists(),
    ]);

    // Create a unique list of artists to store
    const uniqueArtists = [...followedArtists];

    // Add top artists that aren't already in the list
    for (const artist of topArtistsList) {
      if (!uniqueArtists.some((a) => a.id === artist.id)) {
        uniqueArtists.push(artist);
      }
    }

    // Store artists in the database
    for (const artist of uniqueArtists) {
      // Check if artist already exists
      const existingArtist = await db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });

      if (!existingArtist) {
        // Insert artist
        await db.insert(artists).values({
          id: artist.id,
          name: artist.name,
          image_url: artist.images[0]?.url || null,
          followers: artist.followers.total,
          popularity: artist.popularity,
          genres: artist.genres,
          spotify_url: artist.external_urls.spotify,
          last_updated: new Date(),
        });

        // Fetch and store top tracks
        const tracks = await getArtistTopTracks(artist.id);

        for (const track of tracks) {
          await db
            .insert(topTracks)
            .values({
              id: track.id,
              artist_id: artist.id,
              name: track.name,
              album: track.album.name,
              album_id: track.album.id,
              popularity: track.popularity,
              preview_url: track.preview_url,
              spotify_url: track.external_urls.spotify,
              last_updated: new Date(),
            })
            .onConflictDoNothing();
        }
      }
    }

    // Clear existing user followed artists
    await db
      .delete(userFollowedArtists)
      .where(eq(userFollowedArtists.user_id, userId));

    // Store user's followed artists
    for (const artist of followedArtists) {
      await db
        .insert(userFollowedArtists)
        .values({
          user_id: userId,
          artist_id: artist.id,
          followed_at: new Date(),
        })
        .onConflictDoNothing();
    }

    // Clear existing user top artists
    await db.delete(userTopArtists).where(eq(userTopArtists.user_id, userId));

    // Store user's top artists with ranking
    for (let i = 0; i < topArtistsList.length; i++) {
      const artist = topArtistsList[i];
      await db
        .insert(userTopArtists)
        .values({
          user_id: userId,
          artist_id: artist.id,
          rank: i + 1,
          last_updated: new Date(),
        })
        .onConflictDoNothing();
    }

    return true;
  } catch (error) {
    console.error("Error storing user Spotify data:", error);
    return false;
  }
}
