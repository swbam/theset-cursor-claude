import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Music, RefreshCw, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storeUserSpotifyData } from "@/lib/api/spotify";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata = {
  title: "My Spotify Artists",
  description:
    "View your followed and top artists from Spotify, and discover their upcoming shows",
};

async function refreshSpotifyData(userId: string) {
  "use server";

  try {
    await storeUserSpotifyData(userId);
    revalidatePath("/my/artists");
    return { success: true };
  } catch (error) {
    console.error("Error refreshing Spotify data:", error);
    return { success: false, error: "Failed to refresh Spotify data" };
  }
}

async function FollowedArtists({ userId }: { userId: string }) {
  const followedArtists = await db.query.userFollowedArtists.findMany({
    where: (userFollowedArtists, { eq }) =>
      eq(userFollowedArtists.user_id, userId),
    with: {
      artist: true,
    },
    orderBy: (userFollowedArtists, { desc }) =>
      desc(userFollowedArtists.followed_at),
  });

  if (followedArtists.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No followed artists found</h3>
        <p className="text-muted-foreground">
          You don't have any artists you follow on Spotify, or we haven't been
          able to fetch them yet.
        </p>
        <form action={refreshSpotifyData.bind(null, userId)}>
          <Button type="submit" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Spotify Data
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <form action={refreshSpotifyData.bind(null, userId)}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {followedArtists.map(({ artist }) => (
          <ArtistCard
            key={artist.id}
            id={artist.id}
            name={artist.name}
            imageUrl={artist.image_url}
            followers={artist.followers}
          />
        ))}
      </div>
    </div>
  );
}

async function TopArtists({ userId }: { userId: string }) {
  const topArtists = await db.query.userTopArtists.findMany({
    where: (userTopArtists, { eq }) => eq(userTopArtists.user_id, userId),
    with: {
      artist: true,
    },
    orderBy: (userTopArtists, { asc }) => asc(userTopArtists.rank),
  });

  if (topArtists.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No top artists found</h3>
        <p className="text-muted-foreground">
          We haven't been able to fetch your top artists from Spotify yet.
        </p>
        <form action={refreshSpotifyData.bind(null, userId)}>
          <Button type="submit" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Spotify Data
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Your most listened to artists on Spotify
        </p>
        <form action={refreshSpotifyData.bind(null, userId)}>
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {topArtists.map(({ artist, rank }) => (
          <ArtistCard
            key={artist.id}
            id={artist.id}
            name={artist.name}
            imageUrl={artist.image_url}
            followers={artist.followers}
            rank={rank}
          />
        ))}
      </div>
    </div>
  );
}

export default async function MySpotifyArtistsPage() {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Spotify Artists</h1>
        <p className="text-muted-foreground">
          View your followed and top artists from Spotify, and discover their
          upcoming shows
        </p>
      </div>

      <Tabs defaultValue="followed" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="followed" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Artists I Follow
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            My Top Artists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followed" className="space-y-6">
          <Suspense fallback={<ArtistsGridSkeleton />}>
            <FollowedArtists userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="top" className="space-y-6">
          <Suspense fallback={<ArtistsGridSkeleton />}>
            <TopArtists userId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
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
      <div className="relative aspect-square">
        <Link href={`/artist/${id}`}>
          <Image
            src={imageUrl || "/images/artist-placeholder.jpg"}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {rank && (
            <div className="absolute top-2 left-2 bg-black/60 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center">
              #{rank}
            </div>
          )}
        </Link>
      </div>
      <CardContent className="p-4">
        <Link href={`/artist/${id}`} className="hover:underline">
          <CardTitle className="line-clamp-1">{name}</CardTitle>
        </Link>
        {followers && (
          <p className="text-sm text-muted-foreground mt-1">
            {followers.toLocaleString()} followers
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ArtistsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
