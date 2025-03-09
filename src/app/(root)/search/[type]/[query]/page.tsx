import type { Artist } from "@/types";

import { SearchResults } from "@/app/(root)/search/[type]/[query]/_components/search-results";
import { spotify } from "@/lib/spotify-api";

export const runtime = "edge";

interface ArtistSearchResult {
  total: number;
  results: Artist[];
}

interface SearchParams {
  params: {
    query: string;
    type: string;
  };
}

export async function generateMetadata({ params }: SearchParams) {
  const { query } = params;

  return {
    title: `Search results for "${decodeURIComponent(query)}"`,
    description: `Find artists and concerts matching your search for "${decodeURIComponent(query)}"`,
  };
}

export default async function SearchPage({ params }: SearchParams) {
  const { query, type } = params;

  // Ensure we only search for artists
  const searchType = "artist";
  const decodedQuery = decodeURIComponent(query);

  // Search for artists using Spotify API
  const artistResults = await spotify.searchArtists(decodedQuery);

  // Format results
  const searchResults = {
    artists: {
      total: artistResults.artists.total,
      results: artistResults.artists.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || "/images/artist-placeholder.jpg",
        type: "artist",
        url: `/artists/${artist.id}`,
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        genres: artist.genres || [],
      })),
    },
  };

  return (
    <SearchResults
      query={decodedQuery}
      type={searchType}
      searchResults={searchResults}
    />
  );
}
