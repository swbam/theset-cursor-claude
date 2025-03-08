"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, TicketIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export async function UpcomingShows() {
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre");
  const location = searchParams.get("location");
  const dateParam = searchParams.get("date");

  // Get current date
  const now = new Date();

  // Get upcoming shows
  let upcomingShows = await db.query.shows.findMany({
    where: (shows, { gte }) => gte(shows.date, now),
    with: {
      artist: true,
      venue: true,
    },
    orderBy: (shows, { asc }) => asc(shows.date),
    limit: 6,
  });

  // Apply filters
  if (genre && genre !== "All Genres") {
    upcomingShows = upcomingShows.filter((show) =>
      show.artist.genres.some((g) =>
        g.toLowerCase().includes(genre.toLowerCase())
      )
    );
  }

  if (location) {
    upcomingShows = upcomingShows.filter(
      (show) =>
        show.venue.name.toLowerCase().includes(location.toLowerCase()) ||
        show.venue.city.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (dateParam) {
    const filterDate = new Date(dateParam);
    upcomingShows = upcomingShows.filter((show) => {
      const showDate = new Date(show.date);
      return showDate.toDateString() === filterDate.toDateString();
    });
  }

  // Limit to 3 shows for display
  upcomingShows = upcomingShows.slice(0, 3);

  if (upcomingShows.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No upcoming shows found</h3>
        <p className="text-muted-foreground">
          {genre || location || dateParam ?
            "Try adjusting your filters to see more results."
          : "Check back later for new concert listings."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {upcomingShows.map((show) => (
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
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {format(new Date(show.date), "MMM d")}
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
