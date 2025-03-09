import { cache } from "react";
import { eq } from "drizzle-orm";

import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { artists, shows, topTracks, venues } from "@/lib/db/schema";

// Types
export interface ArtistSearchResult {
  id: string;
  name: string;
  image: string | null;
  type: "artist";
}

export interface ShowSearchResult {
  id: string;
  name: string;
  image: string | null;
  venue: string;
  date: string;
  type: "show";
}

export interface VenueSearchResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  type: "venue";
}

export interface AllSearch {
  artists: ArtistSearchResult[];
  shows: ShowSearchResult[];
  venues: VenueSearchResult[];
}

// Cached token state
let accessToken = "";
let tokenExpiry = 0;

async function getAccessToken() {
  // Check if token is still valid
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken;
  }

  // If no valid token, get a new one
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify token: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry with a 60 second buffer
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    throw error;
  }
}

// Base Spotify API request function
async function spotifyRequest<T>(
  endpoint: string,
  method: string = "GET",
  params?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();

  // Build URL with query parameters if provided
  const url = new URL(`https://api.spotify.com/v1${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Spotify API client
export const spotify = {
  // Search for artists
  searchArtists: cache(
    async (query: string, limit: number = 20, offset: number = 0) => {
      return spotifyRequest<SpotifyApi.ArtistSearchResponse>("/search", "GET", {
        q: query,
        type: "artist",
        limit: limit.toString(),
        offset: offset.toString(),
      });
    }
  ),

  // Get artist details
  getArtist: cache(async (id: string) => {
    return spotifyRequest<SpotifyApi.SingleArtistResponse>(`/artists/${id}`);
  }),

  // Get artist's top tracks
  getArtistTopTracks: cache(async (id: string, market: string = "US") => {
    return spotifyRequest<SpotifyApi.ArtistsTopTracksResponse>(
      `/artists/${id}/top-tracks`,
      "GET",
      { market }
    );
  }),

  // Get related artists
  getRelatedArtists: cache(async (id: string) => {
    return spotifyRequest<SpotifyApi.ArtistsRelatedArtistsResponse>(
      `/artists/${id}/related-artists`
    );
  }),

  // Get user's followed artists (requires auth token with proper scope)
  getFollowedArtists: cache(async (limit: number = 20, after?: string) => {
    const params: Record<string, string> = {
      type: "artist",
      limit: limit.toString(),
    };

    if (after) {
      params.after = after;
    }

    return spotifyRequest<SpotifyApi.UsersFollowedArtistsResponse>(
      "/me/following",
      "GET",
      params
    );
  }),
};

// Type definitions for Spotify API responses
declare global {
  namespace SpotifyApi {
    interface ArtistSearchResponse {
      artists: {
        href: string;
        items: ArtistObject[];
        limit: number;
        next: string | null;
        offset: number;
        previous: string | null;
        total: number;
      };
    }

    interface ArtistObject {
      id: string;
      name: string;
      type: "artist";
      uri: string;
      href: string;
      external_urls: {
        spotify: string;
      };
      followers: {
        href: string | null;
        total: number;
      };
      genres: string[];
      images: ImageObject[];
      popularity: number;
    }

    interface ImageObject {
      height: number;
      url: string;
      width: number;
    }

    interface SingleArtistResponse extends ArtistObject {}

    interface ArtistsTopTracksResponse {
      tracks: TrackObject[];
    }

    interface TrackObject {
      id: string;
      name: string;
      type: "track";
      uri: string;
      href: string;
      external_urls: {
        spotify: string;
      };
      album: AlbumObject;
      artists: ArtistObject[];
      disc_number: number;
      duration_ms: number;
      explicit: boolean;
      is_playable: boolean;
      popularity: number;
      preview_url: string | null;
      track_number: number;
    }

    interface AlbumObject {
      id: string;
      name: string;
      type: "album";
      uri: string;
      href: string;
      external_urls: {
        spotify: string;
      };
      album_type: string;
      artists: ArtistObject[];
      images: ImageObject[];
      release_date: string;
      release_date_precision: string;
      total_tracks: number;
    }

    interface ArtistsRelatedArtistsResponse {
      artists: ArtistObject[];
    }

    interface UsersFollowedArtistsResponse {
      artists: {
        items: ArtistObject[];
        next: string | null;
        cursors: {
          after: string;
        };
        limit: number;
        total: number;
      };
    }
  }
}

/**
 * Search for artists, shows, and venues
 */
export async function searchAll(query: string): Promise<AllSearch> {
  if (!query || query.length < 2) {
    return { artists: [], shows: [], venues: [] };
  }

  try {
    // Search artists
    const artistResults = await db.query.artists.findMany({
      where: eq(artists.name, query),
      limit: 5,
    });

    // Search shows
    const showResults = await db.query.shows.findMany({
      where: eq(shows.name, query),
      with: {
        venue: true,
      },
      limit: 5,
    });

    // Search venues
    const venueResults = await db.query.venues.findMany({
      where: eq(venues.name, query),
      limit: 5,
    });

    return {
      artists: artistResults.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.image_url || null,
        type: "artist" as const,
      })),
      shows: showResults.map((show) => ({
        id: show.id,
        name: show.name,
        image: show.image_url || null,
        venue: show.venue?.name || "",
        date: show.date.toISOString(),
        type: "show" as const,
      })),
      venues: venueResults.map((venue) => ({
        id: venue.id,
        name: venue.name,
        city: venue.city || null,
        state: venue.state || null,
        type: "venue" as const,
      })),
    };
  } catch (error) {
    console.error("Error searching:", error);
    return { artists: [], shows: [], venues: [] };
  }
}

/**
 * Search for artists
 */
export async function searchArtists(
  query: string
): Promise<ArtistSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const results = await db.query.artists.findMany({
      where: eq(artists.name, query),
      limit: 10,
    });

    return results.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.image_url || null,
      type: "artist" as const,
    }));
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

/**
 * Get artist's top tracks
 */
export async function getArtistTopTracks(artistId: string) {
  try {
    const tracks = await db.query.topTracks.findMany({
      where: eq(topTracks.artist_id, artistId),
      orderBy: (topTracks, { desc }) => [desc(topTracks.popularity)],
      limit: 10,
    });

    return tracks;
  } catch (error) {
    console.error("Error fetching artist top tracks:", error);
    return [];
  }
}

/**
 * Get artist's upcoming shows
 */
export async function getArtistUpcomingShows(artistId: string) {
  try {
    const now = new Date();

    const artistShows = await db.query.shows.findMany({
      where: eq(shows.artist_id, artistId),
      with: {
        venue: true,
      },
      orderBy: (shows, { asc }) => [asc(shows.date)],
    });

    return artistShows.filter((show) => new Date(show.date) >= now);
  } catch (error) {
    console.error("Error fetching artist shows:", error);
    return [];
  }
}

/**
 * Get megamenu data
 */
export async function getMegaMenu() {
  try {
    // Get popular genres from artists
    const popularArtists = await db.query.artists.findMany({
      orderBy: (artists, { desc }) => [desc(artists.popularity)],
      limit: 10,
    });

    // Simplify by just returning artists
    return {
      genres: ["Rock", "Pop", "Hip-Hop", "Electronic", "R&B", "Country"],
      trending: popularArtists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.image_url || null,
      })),
    };
  } catch (error) {
    console.error("Error fetching megamenu data:", error);
    return {
      genres: [],
      trending: [],
    };
  }
}

/**
 * Search all categories
 */
export async function search(
  query: string,
  type: string,
  page = 1,
  limit = 20
) {
  // Only support artist search now
  if (type !== "artist") {
    console.warn("Only artist search is supported");
    return { total: 0, results: [] };
  }

  const offset = (page - 1) * limit;
  const result = await spotify.searchArtists(query, limit, offset);

  return {
    total: result.artists.total,
    results: result.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || "/images/artist-placeholder.jpg",
      type: "artist",
      url: `/artists/${artist.id}`,
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      genres: artist.genres || [],
    })),
  };
}
