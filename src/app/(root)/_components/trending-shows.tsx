"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, TicketIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShows } from "@/lib/db/server-actions";

export async function TrendingShows() {
  // Get trending shows from the server
  try {
    // Get all shows
    const allShows = await getShows();

    if (!allShows || allShows.length === 0) {
      return (
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">No trending shows found</h3>
          <p className="text-muted-foreground">
            Be the first to vote on a setlist!
          </p>
        </div>
      );
    }

    // Sort shows by most votes (mockup for now)
    const trendingShows = allShows.slice(0, 3);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trendingShows.map((show) => (
          <Link key={show.id} href={`/shows/${show.id}`}>
            <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={show.image_url || "/images/concert-placeholder.jpg"}
                  alt={show.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/80 hover:bg-primary">
                    <UsersIcon className="h-3 w-3 mr-1" />
                    {/* Display vote count if available */}
                    {show.setlist_songs?.reduce(
                      (sum, song) => sum + song.votes,
                      0
                    ) || 0}{" "}
                    votes
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg line-clamp-1">
                  {show.artist?.name || "Unknown Artist"}
                </h3>

                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {format(new Date(show.date), "EEE, MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="line-clamp-1">
                      <span>{show.venue?.name || "Unknown Venue"}, </span>
                      <span className="text-muted-foreground">
                        {show.venue?.city || "Unknown Location"}
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
  } catch (error) {
    console.error("Error fetching trending shows:", error);
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">
          Error loading trending shows
        </h3>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }
}
