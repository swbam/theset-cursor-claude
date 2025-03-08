import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  PencilIcon,
  ThumbsUpIcon,
  TicketIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata = {
  title: "My Setlists",
  description: "Shows you've voted on or suggested songs for",
};

async function VotedSetlists({ userId }: { userId: string }) {
  // Get shows the user has voted on
  const votedShows = await db.query.votes.findMany({
    where: (votes, { eq }) => eq(votes.user_id, userId),
    with: {
      show: {
        with: {
          artist: true,
          venue: true,
        },
      },
    },
    orderBy: (votes, { desc }) => desc(votes.created_at),
  });

  // Group by show to remove duplicates
  const uniqueShows = Array.from(
    new Map(votedShows.map((vote) => [vote.show.id, vote.show])).values()
  );

  if (uniqueShows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No voted setlists found</h3>
        <p className="text-muted-foreground">
          You haven't voted on any setlists yet. Find a show and start voting!
        </p>
        <Button asChild className="mt-4">
          <Link href="/shows">Browse Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uniqueShows.map((show) => (
        <ShowCard
          key={show.id}
          show={show}
          isVoted={true}
          isSuggested={false}
        />
      ))}
    </div>
  );
}

async function SuggestedSetlists({ userId }: { userId: string }) {
  // Get shows the user has suggested songs for
  const suggestedShows = await db.query.setlist_songs.findMany({
    where: (setlistSongs, { eq }) => eq(setlistSongs.suggested_by, userId),
    with: {
      show: {
        with: {
          artist: true,
          venue: true,
        },
      },
    },
    orderBy: (setlistSongs, { desc }) => desc(setlistSongs.created_at),
  });

  // Group by show to remove duplicates
  const uniqueShows = Array.from(
    new Map(suggestedShows.map((song) => [song.show.id, song.show])).values()
  );

  if (uniqueShows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">
          No suggested setlists found
        </h3>
        <p className="text-muted-foreground">
          You haven't suggested any songs for setlists yet. Find a show and
          start suggesting!
        </p>
        <Button asChild className="mt-4">
          <Link href="/shows">Browse Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uniqueShows.map((show) => (
        <ShowCard
          key={show.id}
          show={show}
          isVoted={false}
          isSuggested={true}
        />
      ))}
    </div>
  );
}

export default async function MySetlistsPage() {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Setlists</h1>
        <p className="text-muted-foreground">
          Shows you've voted on or suggested songs for
        </p>
      </div>

      <Tabs defaultValue="voted" className="space-y-6">
        <TabsList>
          <TabsTrigger value="voted">Voted Setlists</TabsTrigger>
          <TabsTrigger value="suggested">Suggested Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="voted" className="space-y-6">
          <Suspense fallback={<ShowsGridSkeleton />}>
            <VotedSetlists userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="suggested" className="space-y-6">
          <Suspense fallback={<ShowsGridSkeleton />}>
            <SuggestedSetlists userId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ShowCardProps {
  show: any;
  isVoted: boolean;
  isSuggested: boolean;
}

function ShowCard({ show, isVoted, isSuggested }: ShowCardProps) {
  return (
    <Link href={`/shows/${show.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48 w-full">
          <Image
            src={
              show.image_url ||
              show.artist.image_url ||
              "/images/concert-placeholder.jpg"
            }
            alt={show.artist.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {isVoted && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <ThumbsUpIcon className="h-3 w-3" />
                Voted
              </Badge>
            )}
            {isSuggested && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <PencilIcon className="h-3 w-3" />
                Suggested
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg line-clamp-1">{show.artist.name}</h3>

          <div className="mt-2 space-y-2">
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{format(new Date(show.date), "EEE, MMM d, yyyy")}</span>
            </div>

            <div className="flex items-center text-sm">
              <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="line-clamp-1">
                <span>{show.venue.name}, </span>
                <span className="text-muted-foreground">{show.venue.city}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full">
              <TicketIcon className="h-4 w-4 mr-2" />
              View Setlist
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ShowsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-4" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>

            <Skeleton className="h-9 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
