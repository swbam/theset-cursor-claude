import { AllSearch as SpotifyAllSearch } from "@/lib/spotify-api";

export type AllSearch = SpotifyAllSearch;

// Website Settings
export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
};

// User related types
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Session {
  user: User;
  expires: string;
}

// Concert and setlist related types
export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  followers?: number;
  popularity?: number;
  genres?: string[];
  spotify_url?: string;
  bio?: string;
  monthly_listeners?: number;
  verified?: boolean;
  social_links?: Record<string, string>;
}

export interface Venue {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  capacity?: number;
  address?: string;
  postal_code?: string;
  url?: string;
  parking_info?: string;
  accessible_seating_info?: string;
}

export interface Show {
  id: string;
  name: string;
  date: Date;
  venue_id?: string;
  artist_id?: string;
  ticket_url?: string;
  event_url?: string;
  image_url?: string;
  description?: string;
  min_price?: number;
  max_price?: number;
  currency?: string;
  total_tickets?: number;
  available_tickets?: number;
  status?: string;
  venue: Venue;
  artist: Artist;
}

export interface TopTrack {
  id: string;
  artist_id: string;
  name: string;
  spotify_id: string;
  preview_url?: string;
  popularity?: number;
}

export interface SetlistSong {
  id: string;
  show_id: string;
  setlist_id?: string;
  track_id?: string;
  artist_id?: string;
  artist_name: string;
  title: string;
  votes: number;
  position?: number;
  suggested_by?: string;
}

export interface Setlist {
  id: string;
  show_id: string;
  is_official?: boolean;
  total_votes?: number;
  songs: SetlistSong[];
}
