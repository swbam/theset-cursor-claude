import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { searchArtists } from "@/lib/api/spotify";

interface ArtistSearchResultsPageProps {
  params: {
    query: string;
  };
}

export async function generateMetadata({
  params,
}: ArtistSearchResultsPageProps) {
  const { query } = params;
  const decodedQuery = decodeURIComponent(query);

  return {
    title: `Search results for "${decodedQuery}"`,
    description: `Find artists matching "${decodedQuery}" and discover their upcoming shows`,
  };
}

export default async function ArtistSearchResultsPage({
  params,
}: ArtistSearchResultsPageProps) {
  const { query } = params;
  const decodedQuery = decodeURIComponent(query);

  let artists = [];

  try {
    const response = await searchArtists(decodedQuery, 24);
    artists = response.artists.items;
  } catch (error) {
    console.error("Error searching artists:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Search results for "{decodedQuery}"
        </h1>
        <p className="text-muted-foreground">{artists.length} artists found</p>
      </div>

      {artists.length === 0 ?
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No artists found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find any artists matching your search.
          </p>
          <Link href="/search" className="text-primary hover:underline">
            Try another search
          </Link>
        </div>
      : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {artists.map((artist) => (
            <Card key={artist.id} className="overflow-hidden">
              <CardHeader className="p-0 h-48 relative">
                <Link href={`/artist/${artist.id}`}>
                  <Image
                    src={artist.images[0]?.url || "/placeholder-artist.jpg"}
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
                <CardDescription className="mt-2 flex flex-wrap gap-1">
                  {artist.genres?.slice(0, 3).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </CardDescription>
              </CardContent>
              <CardFooter className="px-4 pt-0 pb-4">
                <p className="text-xs text-muted-foreground">
                  {artist.followers?.total ?
                    `${artist.followers.total.toLocaleString()} followers`
                  : ""}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
