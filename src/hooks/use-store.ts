import { atom, useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import type { User } from "next-auth";

// Create a custom storage that works in both client and server
const storage = createJSONStorage<unknown>(() => {
  return typeof window !== "undefined" ? localStorage : undefined;
});

// Create a store instance
const store = {};

// User typing state for keyboard shortcuts
const isTypingAtom = atom(false);

export function useIsTyping() {
  return useAtom(isTypingAtom, { store });
}

// User preferences
const streamQualityAtom = atomWithStorage("stream_quality", "high", storage);

export function useStreamQuality() {
  return useAtom(streamQualityAtom, { store });
}

// Setlist voting state
const activeSetlistAtom = atomWithStorage("active_setlist", "", storage);

export function useActiveSetlist() {
  return useAtom(activeSetlistAtom, { store });
}

// User's recent votes
const recentVotesAtom = atomWithStorage(
  "recent_votes",
  {} as Record<string, number>,
  storage
);

export function useRecentVotes() {
  return useAtom(recentVotesAtom, { store });
}

// User's filter preferences for shows
const showFiltersAtom = atomWithStorage(
  "show_filters",
  {
    mainGenre: "",
    subGenres: [],
    location: "",
    radius: "50",
    date: "",
    minPrice: "",
    maxPrice: "",
    sort: "date,asc",
  },
  storage
);

export function useShowFilters() {
  return useAtom(showFiltersAtom, { store });
}

// User's recently viewed shows
const recentlyViewedShowsAtom = atomWithStorage(
  "recently_viewed_shows",
  [] as Array<{
    id: string;
    name: string;
    artistName: string;
    date: string;
    imageUrl: string;
  }>,
  storage,
  { getSize: () => 10 } // Limit to 10 items
);

export function useRecentlyViewedShows() {
  return useAtom(recentlyViewedShowsAtom, { store });
}
