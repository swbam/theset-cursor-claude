import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Music } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata = {
  title: "My Votes",
  description:
    "View your voting history and song suggestions across different shows",
};

async function VotedSongs({ userId }: { userId: string }) {
  const votes = await db.query.votes.findMany({
    where: (votes, { eq }) => eq(votes.user_id, userId),
    with: {
      setlistSong: {
        with: {
          show: {
            with: {
              artist: true,
              venue: true,
            },
          },
        },
      },
    },
    orderBy: (votes, { desc }) => desc(votes.created_at),
  });

  if (votes.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No votes found</h3>
        <p className="text-muted-foreground">
          You haven't voted on any songs yet. Find a show and start voting!
        </p>
        <Button asChild className="mt-4">
          <Link href="/shows">Browse Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {votes.map((vote) => (
        <Card key={vote.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shows/${vote.setlistSong.show.id}`}
                  className="hover:underline"
                >
                  <h4 className="font-medium text-lg truncate">
                    {vote.setlistSong.title}
                  </h4>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Music className="h-4 w-4" />
                  <span>{vote.setlistSong.show.artist.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(
                      new Date(vote.setlistSong.show.date),
                      "MMMM d, yyyy"
                    )}{" "}
                    at {vote.setlistSong.show.venue.name}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Voted {format(new Date(vote.created_at), "MMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function SuggestedSongs({ userId }: { userId: string }) {
  const suggestions = await db.query.setlistSongs.findMany({
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

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No suggestions found</h3>
        <p className="text-muted-foreground">
          You haven't suggested any songs yet. Find a show and start suggesting!
        </p>
        <Button asChild className="mt-4">
          <Link href="/shows">Browse Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((song) => (
        <Card key={song.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shows/${song.show.id}`}
                  className="hover:underline"
                >
                  <h4 className="font-medium text-lg truncate">{song.title}</h4>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Music className="h-4 w-4" />
                  <span>{song.show.artist.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(song.show.date), "MMMM d, yyyy")} at{" "}
                    {song.show.venue.name}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">{song.votes}</span>{" "}
                <span className="text-muted-foreground">votes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export default async function VotingHistoryPage() {
  const user = await requireAuth();

  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Voting History</h1>
        <p className="text-muted-foreground">
          View your voting history and song suggestions across different shows
        </p>
      </div>

      <Tabs defaultValue="votes" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="votes">My Votes</TabsTrigger>
          <TabsTrigger value="suggestions">My Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="votes" className="space-y-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <VotedSongs userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <SuggestedSongs userId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
