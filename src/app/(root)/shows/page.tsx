import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { CalendarIcon, DollarSign, MapPinIcon, ThumbsUp } from "lucide-react";

import { ShowFilters } from "@/components/show-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

export const metadata = {
  title: "Discover Shows",
  description: "Find concerts near you, filter by genre, and vote on setlists",
};

interface ShowsPageProps {
  searchParams: {
    mainGenre?: string;
    subGenres?: string;
    location?: string;
    radius?: string;
    date?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

async function getFilteredShows(searchParams: ShowsPageProps["searchParams"]) {
  const {
    mainGenre,
    subGenres,
    location,
    radius,
    date,
    minPrice,
    maxPrice,
    sort = "date-asc",
  } = searchParams;

  // Base query
  let query = db.query.shows.findMany({
    with: {
      artist: true,
      venue: true,
      setlist_songs: {
        columns: {
          votes: true,
        },
      },
    },
  });

  // Apply filters
  const filters = [];

  // Genre filters
  if (mainGenre && mainGenre !== "All Genres") {
    // Use json containment operator for genres array
    filters.push(sql`${db.query.artists.genres}::jsonb ? ${mainGenre}`);

    if (subGenres) {
      const subGenreList = subGenres.split(",");
      const subGenreFilters = subGenreList.map(
        (genre: string) => sql`${db.query.artists.genres}::jsonb ? ${genre}`
      );

      if (subGenreFilters.length > 0) {
        filters.push(or(...subGenreFilters));
      }
    }
  }

  // Location filter
  if (location) {
    const searchRadius = parseInt(radius || "50");

    // If we have coordinates for the location
    if (location.includes(",")) {
      const [lat, lng] = location.split(",").map(Number);
      filters.push(
        sql`ST_DWithin(
          ST_MakePoint(${lng}, ${lat})::geography,
          ST_MakePoint(${db.query.venues.longitude}, ${db.query.venues.latitude})::geography,
          ${searchRadius * 1609.34}
        )`
      );
    } else {
      // Search by city name
      filters.push(
        or(
          ilike(db.query.venues.city, `%${location}%`),
          ilike(db.query.venues.name, `%${location}%`)
        )
      );
    }
  }

  // Date filter
  if (date) {
    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    filters.push(
      and(
        gte(db.query.shows.date, selectedDate),
        lte(db.query.shows.date, nextDay)
      )
    );
  } else {
    // Default to upcoming shows
    filters.push(gte(db.query.shows.date, new Date()));
  }

  // Price filter
  if (minPrice || maxPrice) {
    const min = parseInt(minPrice || "0");
    const max = parseInt(maxPrice || "1000");

    filters.push(
      and(
        gte(db.query.shows.min_price || 0, min),
        lte(db.query.shows.max_price || 1000, max)
      )
    );
  }

  // Apply all filters
  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  // Apply sorting
  switch (sort) {
    case "date-desc":
      query = query.orderBy(desc(db.query.shows.date));
      break;
    case "votes-desc":
      query = query.orderBy(
        desc(sql`(
        SELECT SUM(votes) 
        FROM setlist_songs 
        WHERE show_id = shows.id
      )`)
      );
      break;
    case "popularity-desc":
      query = query.orderBy(desc(db.query.artists.popularity));
      break;
    case "price-asc":
      query = query.orderBy(asc(db.query.shows.min_price));
      break;
    case "price-desc":
      query = query.orderBy(desc(db.query.shows.max_price));
      break;
    case "distance-asc":
      if (location?.includes(",")) {
        const [lat, lng] = location.split(",").map(Number);
        query = query.orderBy(
          asc(sql`
          ST_Distance(
            ST_MakePoint(${lng}, ${lat})::geography,
            ST_MakePoint(${db.query.venues.longitude}, ${db.query.venues.latitude})::geography
          )
        `)
        );
      }
      break;
    default: // date-asc
      query = query.orderBy(asc(db.query.shows.date));
  }

  // Limit results
  query = query.limit(50);

  return query;
}

async function FilteredShows({ searchParams }: ShowsPageProps) {
  const shows = await getFilteredShows(searchParams);

  if (shows.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No shows found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shows.map((show) => (
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {show.artist.genres &&
                Array.isArray(show.artist.genres) &&
                show.artist.genres.length > 0 && (
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {(show.artist.genres as string[])
                      .slice(0, 2)
                      .map((genre: string) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="bg-black/50 hover:bg-black/60"
                        >
                          {genre}
                        </Badge>
                      ))}
                  </div>
                )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg line-clamp-1">
                {show.artist.name}
              </h3>

              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {format(
                      new Date(show.date),
                      "EEE, MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="line-clamp-1">
                    <span>{show.venue.name}, </span>
                    <span className="text-muted-foreground">
                      {show.venue.city || ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {show.setlist_songs.reduce(
                        (sum: number, song: { votes: number }) =>
                          sum + (song.votes || 0),
                        0
                      )}{" "}
                      votes
                    </span>
                  </div>

                  {(show.min_price || show.max_price) && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>
                        {(
                          show.min_price &&
                          show.max_price &&
                          show.min_price === show.max_price
                        ) ?
                          `$${show.min_price}`
                        : `$${show.min_price || 0} - $${show.max_price || 0}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Button variant="secondary" size="sm" className="w-full">
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

export default function ShowsPage({ searchParams }: ShowsPageProps) {
  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Shows</h1>
        <p className="text-muted-foreground">
          Find concerts near you, filter by genre, and vote on setlists
        </p>
      </div>

      <div className="space-y-6">
        <ShowFilters />

        <Suspense fallback={<ShowsGridSkeleton />}>
          <FilteredShows searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function ShowsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-4" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
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
