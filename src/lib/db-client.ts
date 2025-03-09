"use client";

/**
 * Client-side database utilities
 *
 * This file provides type-safe access to our database schema
 * without importing any Node.js modules. It uses the API routes
 * for actual data fetching.
 */
import type {
  ArtistTable,
  SetlistSongTable,
  ShowTable,
  TopTrackTable,
  UserFollowedArtistTable,
  UserTopArtistTable,
  VenueTable,
  VoteTable,
} from "./db/schema-client";

import { fetchServerData } from "@/lib/data-fetching";

// Type-safe database client for client components
export const clientDb = {
  // Artists
  artists: {
    findMany: async (): Promise<ArtistTable[]> => {
      return fetchServerData<ArtistTable[]>("artists") || [];
    },
    findUnique: async (id: string): Promise<ArtistTable | null> => {
      return fetchServerData<ArtistTable>("artists", id);
    },
    findByName: async (name: string): Promise<ArtistTable[]> => {
      // This would need a custom API endpoint
      const artists = await fetchServerData<ArtistTable[]>("artists");
      return (
        artists?.filter((artist) =>
          artist.name.toLowerCase().includes(name.toLowerCase())
        ) || []
      );
    },
  },

  // Venues
  venues: {
    findMany: async (): Promise<VenueTable[]> => {
      return fetchServerData<VenueTable[]>("venues") || [];
    },
    findUnique: async (id: string): Promise<VenueTable | null> => {
      return fetchServerData<VenueTable>("venues", id);
    },
    findByCity: async (city: string): Promise<VenueTable[]> => {
      // This would need a custom API endpoint
      const venues = await fetchServerData<VenueTable[]>("venues");
      return (
        venues?.filter((venue) =>
          venue.city.toLowerCase().includes(city.toLowerCase())
        ) || []
      );
    },
  },

  // Shows
  shows: {
    findMany: async (): Promise<ShowTable[]> => {
      return fetchServerData<ShowTable[]>("shows") || [];
    },
    findUnique: async (id: string): Promise<ShowTable | null> => {
      return fetchServerData<ShowTable>("shows", id);
    },
    findByArtist: async (artistId: string): Promise<ShowTable[]> => {
      // This would need a custom API endpoint
      const shows = await fetchServerData<ShowTable[]>("shows");
      return shows?.filter((show) => show.artist_id === artistId) || [];
    },
    findByVenue: async (venueId: string): Promise<ShowTable[]> => {
      // This would need a custom API endpoint
      const shows = await fetchServerData<ShowTable[]>("shows");
      return shows?.filter((show) => show.venue_id === venueId) || [];
    },
    findUpcoming: async (): Promise<ShowTable[]> => {
      // This would need a custom API endpoint
      const shows = await fetchServerData<ShowTable[]>("shows");
      const now = new Date();
      return (
        shows?.filter((show) => {
          const showDate = new Date(show.date);
          return showDate > now;
        }) || []
      );
    },
  },

  // Setlist songs
  setlistSongs: {
    findByShow: async (showId: string): Promise<SetlistSongTable[]> => {
      // This would need a custom API endpoint
      // For now, we can get this from the show data
      const show = await fetchServerData<
        ShowTable & { setlist_songs?: SetlistSongTable[] }
      >("shows", showId);
      return show?.setlist_songs || [];
    },
  },
};
