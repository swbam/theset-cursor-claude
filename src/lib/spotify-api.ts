import { eq } from "drizzle-orm";

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
  type: string,
  query: string,
  page = 1,
  limit = 10
) {
  const offset = (page - 1) * limit;

  switch (type) {
    case "artists":
      return searchArtists(query);

    case "shows":
      // Implement show search logic here
      return [];

    case "venues":
      // Implement venue search logic here
      return [];

    default:
      return [];
  }
}
