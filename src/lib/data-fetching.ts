/**
 * Client-side data fetching utilities
 * These functions fetch data from the API routes instead of directly accessing the database
 */

import { Artist, Show, Venue } from "@/types";

/**
 * Fetch data from the server-data API
 */
export async function fetchServerData<T>(
  type: string,
  id?: string
): Promise<T | null> {
  try {
    const params = new URLSearchParams();
    params.append("type", type);
    if (id) {
      params.append("id", id);
    }

    const response = await fetch(`/api/server-data?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Error fetching ${type}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data as T;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return null;
  }
}

/**
 * Fetch artists
 */
export async function fetchArtists(): Promise<Artist[]> {
  const data = await fetchServerData<Artist[]>("artists");
  return data || [];
}

/**
 * Fetch a single artist
 */
export async function fetchArtist(id: string): Promise<Artist | null> {
  return fetchServerData<Artist>("artists", id);
}

/**
 * Fetch shows
 */
export async function fetchShows(): Promise<Show[]> {
  const data = await fetchServerData<Show[]>("shows");
  return data || [];
}

/**
 * Fetch a single show
 */
export async function fetchShow(id: string): Promise<Show | null> {
  return fetchServerData<Show>("shows", id);
}

/**
 * Fetch venues
 */
export async function fetchVenues(): Promise<Venue[]> {
  const data = await fetchServerData<Venue[]>("venues");
  return data || [];
}

/**
 * Fetch a single venue
 */
export async function fetchVenue(id: string): Promise<Venue | null> {
  return fetchServerData<Venue>("venues", id);
}
