"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, TicketIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export async function TrendingShows() {
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre");
  const location = searchParams.get("location");
  const dateParam = searchParams.get("date");

  // Get shows with most votes
  let trendingShows = await db.query.shows.findMany({
    with: {
      artist: true,
      venue: true,
      setlist_songs: {
        columns: {
          votes: true,
        },
      },
    },
    orderBy: (shows, { desc }) => [
      desc(
        db
          .select({
            totalVotes: db.fn.sum(db.ref("setlist_songs.votes")),
          })
          .from(db.ref("setlist_songs"))
          .where(db.eq(db.ref("setlist_songs.show_id"), shows.id))
          .as("total_votes")
      ),
    ],
    limit: 6,
  });

  // Apply filters
  if (genre && genre !== "All Genres") {
    trendingShows = trendingShows.filter((show) =>
      show.artist.genres.some((g) =>
        g.toLowerCase().includes(genre.toLowerCase())
      )
    );
  }

  if (location) {
    trendingShows = trendingShows.filter(
      (show) =>
        show.venue.name.toLowerCase().includes(location.toLowerCase()) ||
        show.venue.city.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (dateParam) {
    const filterDate = new Date(dateParam);
    trendingShows = trendingShows.filter((show) => {
      const showDate = new Date(show.date);
      return showDate.toDateString() === filterDate.toDateString();
    });
  }

  // Limit to 3 shows for display
  trendingShows = trendingShows.slice(0, 3);

  if (trendingShows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No trending shows found</h3>
        <p className="text-muted-foreground">
          {genre || location || dateParam ?
            "Try adjusting your filters to see more results."
          : "Be the first to vote on a setlist!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trendingShows.map((show) => (
        <Link key={show.id} href={`/shows/${show.id}`}>
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary/80 hover:bg-primary">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  {show.setlist_songs.reduce(
                    (sum, song) => sum + song.votes,
                    0
                  )}{" "}
                  votes
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg line-clamp-1">
                {show.artist.name}
              </h3>

              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(show.date), "EEE, MMM d, yyyy")}</span>
                </div>

                <div className="flex items-center text-sm">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="line-clamp-1">
                    <span>{show.venue.name}, </span>
                    <span className="text-muted-foreground">
                      {show.venue.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="secondary" size="sm" className="w-full">
                  <TicketIcon className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
