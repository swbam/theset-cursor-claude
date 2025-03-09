/**
 * Client-side schema definitions
 *
 * This file contains type-only exports of our database schema
 * for use in client components. It does not import any Node.js
 * modules or database drivers.
 */

// Artist table
export interface ArtistTable {
  id: string;
  name: string;
  image: string;
  type: string;
  url: string;
  followers?: number;
  popularity?: number;
  genres?: string[];
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Venue table
export interface VenueTable {
  id: string;
  name: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  image_url?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Show table
export interface ShowTable {
  id: string;
  title: string;
  date: Date | string;
  artist_id: string;
  venue_id: string;
  image_url?: string;
  min_price?: number;
  max_price?: number;
  ticket_url?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Top track table
export interface TopTrackTable {
  id: string;
  artist_id: string;
  name: string;
  spotify_id: string;
  preview_url?: string;
  popularity?: number;
  created_at?: Date | string;
}

// Setlist song table
export interface SetlistSongTable {
  id: string;
  show_id: string;
  song_name: string;
  artist_name: string;
  votes: number;
  position: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Vote table
export interface VoteTable {
  id: string;
  user_id: string;
  setlist_song_id: string;
  created_at: Date | string;
}

// User followed artist table
export interface UserFollowedArtistTable {
  user_id: string;
  artist_id: string;
  created_at?: Date | string;
}

// User top artist table
export interface UserTopArtistTable {
  user_id: string;
  artist_id: string;
  rank: number;
  created_at?: Date | string;
}
