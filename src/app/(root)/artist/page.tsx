import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { artists } from "@/lib/db/schema";

export const metadata = {
  title: "Artists",
  description: "Discover artists and their upcoming shows",
};

async function ArtistsList() {
  // Get popular artists from our database
  const popularArtists = await db.query.artists.findMany({
    orderBy: (artists, { desc }) => [desc(artists.popularity)],
    limit: 24,
  });

  if (popularArtists.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No artists found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find any artists. Try searching for your favorite artists.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {popularArtists.map((artist) => (
        <Card key={artist.id} className="overflow-hidden">
          <CardHeader className="p-0 h-48 relative">
            <Link href={`/artist/${artist.id}`}>
              <Image
                src={artist.image_url || "/placeholder-artist.jpg"}
                alt={artist.name}
                fill
                className="object-cover"
              />
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <Link href={`/artist/${artist.id}`} className="hover:underline">
              <CardTitle className="line-clamp-1">{artist.name}</CardTitle>
            </Link>
            <div className="mt-2 flex flex-wrap gap-1">
              {artist.genres?.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {artist.followers ?
                `${artist.followers.toLocaleString()} followers`
              : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artists</h1>
        <p className="text-muted-foreground">
          Discover artists and their upcoming shows
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl" />
            ))}
          </div>
        }
      >
        <ArtistsList />
      </Suspense>
    </div>
  );
}
