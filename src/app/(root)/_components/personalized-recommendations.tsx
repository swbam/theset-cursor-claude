"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  SparklesIcon,
  TicketIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShows } from "@/lib/db/server-actions";

interface PersonalizedRecommendationsProps {
  userId: string;
}

export async function PersonalizedRecommendations({
  userId,
}: PersonalizedRecommendationsProps) {
  try {
    // Get all shows
    const allShows = await getShows();

    if (!allShows || allShows.length === 0) {
      return (
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">
            No recommended shows found
          </h3>
          <p className="text-muted-foreground">
            Check back later for personalized recommendations
          </p>
        </div>
      );
    }

    // For now, let's just display some random shows as recommendations
    // In a real implementation, we would get the user's Spotify artists
    // and filter shows based on those artists
    const recommendedShows = allShows.slice(0, 3);

    if (recommendedShows.length === 0) {
      return (
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-xl font-medium mb-2">
            No recommended shows found
          </h3>
          <p className="text-muted-foreground">
            Follow more artists on Spotify for personalized recommendations
          </p>
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
                  src={show.image_url || "/images/concert-placeholder.jpg"}
                  alt={show.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
                <div className="absolute top-2 right-2">
                  <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    Recommended
                  </div>
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
    console.error("Error fetching personalized recommendations:", error);
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">
          Error loading recommendations
        </h3>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }
}
