/**
 * Core types for TheSet application
 * These types represent the data models used throughout the application
 */

// Artist type from Spotify API
export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

// Artist type for our application
export interface Artist {
  id: string;
  name: string;
  image: string;
  type: string;
  url: string;
  followers?: number;
  popularity?: number;
  genres?: string[];
}

// Venue type for concert locations
export interface Venue {
  id: string;
  name: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  image_url?: string;
}

// Show (concert) type
export interface Show {
  id: string;
  title: string;
  date: Date | string;
  artist_id: string;
  venue_id: string;
  image_url?: string;
  min_price?: number;
  max_price?: number;
  ticket_url?: string;
  artist?: Artist;
  venue?: Venue;
  setlist_songs?: SetlistSong[];
}

// Top tracks from an artist
export interface TopTrack {
  id: string;
  artist_id: string;
  name: string;
  spotify_id: string;
  preview_url?: string;
  popularity?: number;
}

// Song in a setlist with voting information
export interface SetlistSong {
  id: string;
  show_id: string;
  song_name: string;
  artist_name: string;
  votes: number;
  position: number;
  user_has_voted?: boolean;
}

// Complete setlist for a show
export interface Setlist {
  show_id: string;
  songs: SetlistSong[];
}

// User vote on a setlist song
export interface Vote {
  id: string;
  user_id: string;
  setlist_song_id: string;
  created_at: Date | string;
}

// User's followed artists from Spotify
export interface UserFollowedArtist {
  user_id: string;
  artist_id: string;
  artist?: Artist;
}

// User's top artists from Spotify
export interface UserTopArtist {
  user_id: string;
  artist_id: string;
  rank: number;
  artist?: Artist;
}

// Search result types
export interface ArtistSearchResult {
  artists: Artist[];
  total: number;
}

export interface ShowSearchResult {
  shows: Show[];
  total: number;
}

export interface VenueSearchResult {
  venues: Venue[];
  total: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Ticketmaster API types
export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    };
  };
  images: { url: string; width: number; height: number }[];
  priceRanges?: {
    min: number;
    max: number;
    currency: string;
  }[];
  url: string;
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}

export interface TicketmasterVenue {
  id: string;
  name: string;
  city: {
    name: string;
  };
  address?: {
    line1: string;
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  images?: { url: string; width: number; height: number }[];
  capacity?: number;
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: { url: string; width: number; height: number }[];
  externalLinks?: {
    spotify?: { url: string }[];
  };
}
