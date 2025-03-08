import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storeUserSpotifyData } from "@/lib/api/spotify";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { artists, userFollowedArtists, userTopArtists } from "@/lib/db/schema";

export const metadata = {
  title: "My Spotify Artists",
  description: "View your followed and top artists from Spotify",
};

export default async function MySpotifyArtistsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Get followed artists
  const followedArtistsData = await db.query.userFollowedArtists.findMany({
    where: eq(userFollowedArtists.user_id, user.id),
    with: {
      artist: true,
    },
  });

  // Get top artists
  const topArtistsData = await db.query.userTopArtists.findMany({
    where: eq(userTopArtists.user_id, user.id),
    with: {
      artist: true,
    },
    orderBy: (userTopArtists, { asc }) => [asc(userTopArtists.rank)],
  });

  const followedArtists = followedArtistsData.map((fa) => fa.artist);
  const topArtists = topArtistsData.map((ta) => ta.artist);

  const hasArtists = followedArtists.length > 0 || topArtists.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Spotify Artists</h1>

        <form
          action={async () => {
            "use server";
            await storeUserSpotifyData();
          }}
        >
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </form>
      </div>

      {!hasArtists ?
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">No Spotify data found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find any Spotify artist data for your account. Connect
            your Spotify account to see your followed and top artists.
          </p>
          <Button asChild>
            <Link href="/login">Connect Spotify</Link>
          </Button>
        </div>
      : <Tabs defaultValue="followed">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="followed">Followed Artists</TabsTrigger>
            <TabsTrigger value="top">Top Artists</TabsTrigger>
          </TabsList>

          <TabsContent value="followed" className="mt-6">
            {followedArtists.length === 0 ?
              <p className="text-center text-muted-foreground py-8">
                You're not following any artists on Spotify yet.
              </p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {followedArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    id={artist.id}
                    name={artist.name}
                    imageUrl={artist.image_url}
                    followers={artist.followers}
                  />
                ))}
              </div>
            }
          </TabsContent>

          <TabsContent value="top" className="mt-6">
            {topArtists.length === 0 ?
              <p className="text-center text-muted-foreground py-8">
                We couldn't find your top artists from Spotify. Try refreshing
                your data.
              </p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {topArtists.map((artist, index) => (
                  <ArtistCard
                    key={artist.id}
                    id={artist.id}
                    name={artist.name}
                    imageUrl={artist.image_url}
                    followers={artist.followers}
                    rank={index + 1}
                  />
                ))}
              </div>
            }
          </TabsContent>
        </Tabs>
      }
    </div>
  );
}

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  followers: number | null;
  rank?: number;
}

function ArtistCard({ id, name, imageUrl, followers, rank }: ArtistCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0 h-48 relative">
        <Link href={`/artist/${id}`}>
          <Image
            src={imageUrl || "/placeholder-artist.jpg"}
            alt={name}
            fill
            className="object-cover"
          />
          {rank && (
            <div className="absolute top-2 left-2 bg-black/60 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center">
              {rank}
            </div>
          )}
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link href={`/artist/${id}`} className="hover:underline">
          <CardTitle className="line-clamp-1">{name}</CardTitle>
        </Link>
      </CardContent>
      {followers && (
        <CardFooter className="px-4 pt-0 pb-4">
          <p className="text-sm text-muted-foreground">
            {followers.toLocaleString()} followers
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
