"use client";

import { Suspense } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { Album, Artist, SearchReturnType, Song } from "@/types";

import { ArtistList } from "@/components/artist-list";
import { ArtistListSkeleton } from "@/components/artist-list/loading";
import { SliderCard } from "@/components/slider";
import { SongListClient } from "@/components/song-list/song-list.client";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { search } from "@/lib/spotify-api";

export interface ArtistSearchResult {
  total: number;
  results: Artist[];
}

type SearchResultsProps = {
  type: string;
  query: string;
  searchResults: {
    artists: ArtistSearchResult;
  };
};

export function SearchResults({
  type,
  query,
  searchResults,
}: SearchResultsProps) {
  return (
    <div className="container pb-20">
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-2">
          Search results for {`"${query}"`}
        </h1>
        {searchResults.artists.total > 0 && (
          <p className="text-muted-foreground">
            Found {searchResults.artists.total} results
          </p>
        )}
      </div>

      <Tabs defaultValue="artists">
        <TabsList className="mb-4">
          <TabsTrigger value="artists">Artists</TabsTrigger>
        </TabsList>
        <TabsContent value="artists">
          <Suspense fallback={<ArtistListSkeleton count={10} />}>
            <ArtistList artists={searchResults.artists.results} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
