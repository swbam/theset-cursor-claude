import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  CalendarIcon,
  MapPinIcon,
  Music,
  TicketIcon,
  UsersIcon,
} from "lucide-react";

import type { Metadata } from "next";

import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getArtistById, getArtistTopTracks } from "@/lib/api/spotify";
import { getEventsByArtist } from "@/lib/api/ticketmaster";
import { db } from "@/lib/db";
import { artists, shows, venues } from "@/lib/db/schema";
import { SwipeTabs } from "./_components/swipe-tabs";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const artist = await db.query.artists.findFirst({
    where: (artists, { eq }) => eq(artists.id, params.id),
  });

  if (!artist) {
    return {
      title: "Artist Not Found",
      description: "The requested artist could not be found.",
    };
  }

  const title = artist.name;
  const description = `Discover upcoming concerts for ${artist.name} and vote on setlists.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/artist/${params.id}`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/artist/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${process.env.NEXT_PUBLIC_APP_URL}/artist/${params.id}/opengraph-image`,
      ],
    },
  };
}

async function ArtistDetails({ id }: { id: string }) {
  // Get artist from database
  let artist = await db.query.artists.findFirst({
    where: (artists, { eq }) => eq(artists.id, id),
  });

  // If artist not in database, fetch from Spotify and store
  if (!artist) {
    try {
      const spotifyArtist = await getArtistById(id);

      if (!spotifyArtist) {
        notFound();
      }

      // Store artist in database
      await db.insert(artists).values({
        id: spotifyArtist.id,
        name: spotifyArtist.name,
        image_url: spotifyArtist.images[0]?.url || null,
        followers: spotifyArtist.followers.total,
        popularity: spotifyArtist.popularity,
        genres: spotifyArtist.genres,
        spotify_url: spotifyArtist.external_urls.spotify,
        last_updated: new Date(),
      });

      // Get artist from database again
      artist = await db.query.artists.findFirst({
        where: (artists, { eq }) => eq(artists.id, id),
      });

      // Fetch and store top tracks
      const topTracks = await getArtistTopTracks(id);

      if (topTracks && topTracks.length > 0) {
        // Store top tracks in database (implementation depends on your schema)
        // This would be used for setlist suggestions
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
      notFound();
    }
  }

  if (!artist) {
    notFound();
  }

  // Get upcoming shows for this artist
  let upcomingShows = await db.query.shows.findMany({
    where: (shows, { eq, gt }) => {
      return (
        eq(shows.artist_id, id) && gt(shows.date, new Date().toISOString())
      );
    },
    with: {
      venue: true,
    },
    orderBy: (shows, { asc }) => asc(shows.date),
  });

  // If no shows in database, fetch from Ticketmaster and store
  if (upcomingShows.length === 0) {
    try {
      const events = await getEventsByArtist(artist.name);

      if (events && events._embedded?.events) {
        for (const event of events._embedded.events) {
          const venue = event._embedded?.venues?.[0];

          if (!venue) continue;

          // Store venue
          await db
            .insert(venues)
            .values({
              id: venue.id,
              name: venue.name,
              city: venue.city.name,
              state: venue.state?.name || null,
              country: venue.country.name,
              latitude:
                venue.location?.latitude ?
                  parseFloat(venue.location.latitude)
                : null,
              longitude:
                venue.location?.longitude ?
                  parseFloat(venue.location.longitude)
                : null,
              last_updated: new Date(),
            })
            .onConflictDoNothing();

          // Store show
          await db
            .insert(shows)
            .values({
              id: event.id,
              name: event.name,
              date: new Date(event.dates.start.dateTime),
              venue_id: venue.id,
              artist_id: artist.id,
              ticket_url: event.url,
              event_url: event.url,
              image_url:
                event.images.find((img) => img.ratio === "16_9")?.url ||
                event.images[0]?.url,
              description: null,
              last_updated: new Date(),
            })
            .onConflictDoNothing();
        }

        // Get shows again
        upcomingShows = await db.query.shows.findMany({
          where: (shows, { eq, gt }) => {
            return (
              eq(shows.artist_id, id) &&
              gt(shows.date, new Date().toISOString())
            );
          },
          with: {
            venue: true,
          },
          orderBy: (shows, { asc }) => asc(shows.date),
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }

  // Prepare tabs for the SwipeTabs component
  const tabs = [
    {
      value: "upcoming",
      label: "Upcoming Shows",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Shows</h2>

          {upcomingShows.length === 0 ?
            <div className="text-center py-12 bg-muted rounded-lg">
              <h3 className="text-xl font-medium mb-2">
                No upcoming shows found
              </h3>
              <p className="text-muted-foreground">
                We couldn't find any upcoming shows for this artist. Check back
                later!
              </p>
            </div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingShows.map((show) => (
                <Link key={show.id} href={`/shows/${show.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg line-clamp-1">
                        {show.name}
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
                              {show.venue.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          <TicketIcon className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          }
        </div>
      ),
    },
    {
      value: "about",
      label: "About",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">About {artist.name}</h2>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.length > 0 ?
                      artist.genres.map((genre) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))
                    : <p className="text-muted-foreground">
                        No genres available
                      </p>
                    }
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Popularity</h3>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${artist.popularity || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {artist.popularity || 0}/100 on Spotify
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Followers</h3>
                  <p>
                    {artist.followers?.toLocaleString() || "Unknown"} followers
                    on Spotify
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={artist.image_url || "/images/artist-placeholder.jpg"}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
        </div>

        <div className="md:w-2/3 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{artist.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {artist.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {artist.followers?.toLocaleString() || "Unknown"} followers
              </span>
            </div>

            <div className="flex items-center">
              <Music className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Popularity: {artist.popularity || "Unknown"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {artist.spotify_url && (
              <Button variant="outline" asChild>
                <a
                  href={artist.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Spotify
                </a>
              </Button>
            )}

            <ShareButton
              url={`${process.env.NEXT_PUBLIC_APP_URL}/artist/${artist.id}`}
              title={`${artist.name} - Upcoming Shows`}
              description={`Check out upcoming shows for ${artist.name} on TheSet!`}
              variant="outline"
            />
          </div>
        </div>
      </div>

      <Separator />

      <SwipeTabs defaultValue="upcoming" tabs={tabs} className="w-full" />
    </div>
  );
}

export default function ArtistPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6 md:py-10 max-w-5xl">
      <Suspense fallback={<ArtistSkeleton />}>
        <ArtistDetails id={params.id} />
      </Suspense>
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Skeleton className="aspect-square w-full rounded-lg" />
        </div>

        <div className="md:w-2/3 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Separator />

      <div>
        <Skeleton className="h-8 w-48 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
