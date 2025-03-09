/**
 * This is a client-safe version of the schema file that doesn't import Node.js modules
 * It's used for type definitions and structure only, not for actual database operations
 */

// Basic type definitions for client-side use
export type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type Artist = {
  id: string;
  name: string;
  spotify_id: string;
  image_url: string | null;
  genres: string[] | null;
  popularity: number | null;
};

export type Venue = {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
};

export type Show = {
  id: string;
  title: string;
  date: Date;
  artist_id: string;
  venue_id: string;
  image_url: string | null;
  description: string | null;
  min_price: number | null;
  max_price: number | null;
  ticket_url: string | null;
  status: string;
};

export type SetlistSong = {
  id: string;
  show_id: string;
  song_name: string;
  artist_name: string;
  votes: number;
  position: number;
  suggested_by: string | null;
};

export type Vote = {
  id: string;
  user_id: string;
  setlist_song_id: string;
  created_at: Date;
};

// Mock tables for client-side use
export const users = {
  id: "id",
};

export const artists = {
  id: "id",
};

export const venues = {
  id: "id",
};

export const shows = {
  id: "id",
};

export const setlistSongs = {
  id: "id",
  _: { name: "setlist_songs" },
};

export const votes = {
  id: "id",
};
