"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { eq, inArray } from "drizzle-orm";
import { CalendarIcon, HeartIcon, MapPinIcon, TicketIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { artists, shows, userFollowedArtists } from "@/lib/db/schema";

interface PersonalizedRecommendationsProps {
  userId: string;
}

export async function PersonalizedRecommendations({
  userId,
}: PersonalizedRecommendationsProps) {
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre");
  const location = searchParams.get("location");
  const dateParam = searchParams.get("date");

  // Get user's followed artists
  const userArtists = await db.query.userFollowedArtists.findMany({
    where: (userFollowedArtists, { eq }) =>
      eq(userFollowedArtists.user_id, userId),
    with: {
      artist: true,
    },
  });

  // If user has no followed artists, show a message
  if (userArtists.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No followed artists found</h3>
        <p className="text-muted-foreground">
          Follow artists on Spotify to see personalized show recommendations.
        </p>
        <Button asChild className="mt-4">
          <Link href="/my/artists">View My Artists</Link>
        </Button>
      </div>
    );
  }

  // Get artist IDs
  const artistIds = userArtists.map((ua) => ua.artist_id);

  // Get upcoming shows for user's artists
  const now = new Date();
  let recommendedShows = await db.query.shows.findMany({
    where: (shows, { inArray, gte }) => {
      return inArray(shows.artist_id, artistIds) && gte(shows.date, now);
    },
    with: {
      artist: true,
      venue: true,
    },
    orderBy: (shows, { asc }) => asc(shows.date),
    limit: 6,
  });

  // Apply filters
  if (genre && genre !== "All Genres") {
    recommendedShows = recommendedShows.filter((show) =>
      show.artist.genres.some((g) =>
        g.toLowerCase().includes(genre.toLowerCase())
      )
    );
  }

  if (location) {
    recommendedShows = recommendedShows.filter(
      (show) =>
        show.venue.name.toLowerCase().includes(location.toLowerCase()) ||
        show.venue.city.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (dateParam) {
    const filterDate = new Date(dateParam);
    recommendedShows = recommendedShows.filter((show) => {
      const showDate = new Date(show.date);
      return showDate.toDateString() === filterDate.toDateString();
    });
  }

  // Limit to 3 shows for display
  recommendedShows = recommendedShows.slice(0, 3);

  // If no upcoming shows for user's artists, show a message
  if (recommendedShows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">
          No upcoming shows for your artists
        </h3>
        <p className="text-muted-foreground">
          {genre || location || dateParam ?
            "Try adjusting your filters to see more results."
          : "Your followed artists don't have any upcoming shows at the moment."
          }
        </p>
        <Button asChild className="mt-4">
          <Link href="/shows">Browse All Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {recommendedShows.map((show) => (
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
                <Badge className="bg-red-500/80 hover:bg-red-500">
                  <HeartIcon className="h-3 w-3 mr-1" />
                  Your Artist
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
