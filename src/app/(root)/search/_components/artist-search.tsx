"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { Calendar, MapPin, Music, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ArtistSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<"popularity" | "name">("popularity");

  // Debounce search query
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 300),
    []
  );

  // Update URL when query changes
  useEffect(() => {
    if (debouncedQuery) {
      const params = new URLSearchParams(searchParams);
      params.set("q", debouncedQuery);
      router.push(`/search?${params.toString()}`);
    } else if (searchParams.has("q")) {
      const params = new URLSearchParams(searchParams);
      params.delete("q");
      router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
    }
  }, [debouncedQuery, router, searchParams]);

  // Fetch artists when query changes
  useEffect(() => {
    async function fetchArtists() {
      if (!debouncedQuery.trim()) {
        setArtists([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/artists?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await response.json();
        setArtists(data);
      } catch (error) {
        console.error("Error searching artists:", error);
        setArtists([]);
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, [debouncedQuery]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSetQuery(value);
  };

  // Sort artists based on selected criteria
  const sortedArtists = [...artists].sort((a, b) => {
    if (sortBy === "popularity") {
      return (b.popularity || 0) - (a.popularity || 0);
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for artists..."
          className="pl-10"
          value={query}
          onChange={handleQueryChange}
        />
      </div>

      {debouncedQuery && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ?
              "Searching..."
            : `${artists.length} results for "${debouncedQuery}"`}
          </p>
          <Tabs
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "popularity" | "name")}
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="popularity">Popularity</TabsTrigger>
              <TabsTrigger value="name">Name</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {loading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArtistCardSkeleton key={i} />
          ))}
        </div>
      : debouncedQuery && artists.length === 0 ?
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">No artists found</h3>
          <p className="text-muted-foreground">
            We couldn't find any artists matching "{debouncedQuery}". Try a
            different search term.
          </p>
        </div>
      : debouncedQuery ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              id={artist.id}
              name={artist.name}
              imageUrl={artist.image_url}
              followers={artist.followers}
              popularity={artist.popularity}
              genres={artist.genres}
            />
          ))}
        </div>
      : null}
    </div>
  );
}

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  followers: number | null;
  popularity: number | null;
  genres: string[];
}

function ArtistCard({
  id,
  name,
  imageUrl,
  followers,
  popularity,
  genres,
}: ArtistCardProps) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
          <Image
            src={imageUrl || "/images/artist-placeholder.jpg"}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-bold text-lg line-clamp-1">{name}</h3>

          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
            {genres.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{genres.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{followers?.toLocaleString() || "Unknown"}</span>
            </div>

            {popularity !== null && (
              <div className="flex items-center">
                <Music className="h-3 w-3 mr-1" />
                <span>{popularity}/100</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button asChild className="w-full">
              <Link href={`/artist/${id}`}>View Concerts</Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function ArtistCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="w-full md:w-1/3 aspect-square md:aspect-auto" />
        <CardContent className="p-4 flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex gap-1 mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex justify-between mt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </div>
    </Card>
  );
}
