import { z } from "zod";

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
  name: string;
  email: string;
  image: string;
}

export interface Session {
  user: User;
  expires: string;
}

// Concert and setlist related types
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

export interface Show {
  id: string;
  title: string;
  date: Date;
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
  song_name: string;
  artist_name: string;
  votes: number;
  position: number;
  user_has_voted?: boolean;
}

export interface Setlist {
  show_id: string;
  songs: SetlistSong[];
}

// Form schemas
export const artistFormSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  image: z.string().url("Must be a valid URL").optional(),
  genres: z.array(z.string()).optional(),
});

export const venueFormSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive().optional(),
  image_url: z.string().url("Must be a valid URL").optional(),
});

export const showFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  artist_id: z.string().min(1, "Artist is required"),
  venue_id: z.string().min(1, "Venue is required"),
  image_url: z.string().url("Must be a valid URL").optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  ticket_url: z.string().url("Must be a valid URL").optional(),
});

export const setlistSongFormSchema = z.object({
  song_name: z.string().min(1, "Song name is required"),
  artist_name: z.string().min(1, "Artist name is required"),
  position: z.number().int().nonnegative(),
});
