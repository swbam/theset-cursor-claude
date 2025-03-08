import Image from "next/image";
import Link from "next/link";

import { db } from "@/lib/db";
import { artists } from "@/lib/db/schema";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

export async function TopSearch() {
  // Get popular artists
  const popularArtists = await db.query.artists.findMany({
    orderBy: (artists, { desc }) => desc(artists.popularity),
    limit: 8,
  });

  if (popularArtists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Popular Artists</h2>
        <p className="text-muted-foreground">
          No popular artists found. Try searching for an artist above.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Popular Artists</h2>
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {popularArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="w-[180px] shrink-0"
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={artist.image_url || "/images/artist-placeholder.jpg"}
                    alt={artist.name}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="180px"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium line-clamp-1">{artist.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {artist.genres.slice(0, 1).map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
