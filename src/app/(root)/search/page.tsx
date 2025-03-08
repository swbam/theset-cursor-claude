import { Suspense } from "react";

import { TopSearch } from "@/components/search/top-search";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtistSearch } from "./_components/artist-search";

export const metadata = {
  title: "Search",
  description: "Search for artists and discover their upcoming shows",
};

export default function SearchPage() {
  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find artists and discover their upcoming shows
        </p>
      </div>

      <Suspense fallback={<TopSearchSkeleton />}>
        <TopSearch />
      </Suspense>

      <ArtistSearch />
    </div>
  );
}

function TopSearchSkeleton() {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Popular Artists</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
