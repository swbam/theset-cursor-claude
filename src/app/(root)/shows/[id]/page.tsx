import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { desc, eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  Calendar,
  CalendarIcon,
  CreditCard,
  ExternalLinkIcon,
  MapPin,
  MapPinIcon,
  Ticket,
  TicketIcon,
} from "lucide-react";

import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { SetlistShareImage } from "@/components/setlist-share-image";
import { SetlistVoting } from "@/components/setlist-voting";
import { ShowViewerCount } from "@/components/show-viewer-count";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { VoteNotifications } from "@/components/vote-notifications";
import { getEventById, getVenueById } from "@/lib/api/ticketmaster";
import { getUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  artists,
  setlists,
  setlistSongs,
  shows,
  venues,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/client";
import { SetlistDisplay } from "./_components/setlist-display";
import { SetlistStats } from "./_components/setlist-stats";
import { SongSuggestion } from "./_components/song-suggestion";
import { SwipeTabs } from "./_components/swipe-tabs";

interface ShowPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ShowPageProps): Promise<Metadata> {
  const show = await db.query.shows.findFirst({
    where: (shows, { eq }) => eq(shows.id, params.id),
    with: {
      artist: true,
      venue: true,
    },
  });

  if (!show) {
    return {
      title: "Show Not Found",
      description: "The requested show could not be found.",
    };
  }

  const showDate = new Date(show.date);
  const title = `${show.artist.name} at ${show.venue.name}`;
  const description = `Vote on the setlist for ${show.artist.name} at ${show.venue.name} on ${format(showDate, "MMMM d, yyyy")}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shows/${params.id}`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/shows/${params.id}/opengraph-image`,
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
        `${process.env.NEXT_PUBLIC_APP_URL}/shows/${params.id}/opengraph-image`,
      ],
    },
  };
}

async function getShowDetails(id: string) {
  // Get show from database
  let show = await db.query.shows.findFirst({
    where: (shows, { eq }) => eq(shows.id, id),
    with: {
      artist: true,
      venue: true,
    },
  });

  // If show not in database, fetch from Ticketmaster and store
  if (!show) {
    try {
      const event = await getEventById(id);

      if (!event) {
        notFound();
      }

      // Check if venue exists
      const venue = event._embedded?.venues?.[0];

      if (!venue) {
        notFound();
      }

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

      // Find artist by name (assuming it exists)
      const artist = await db.query.artists.findFirst({
        where: (artists, { like }) =>
          like(artists.name, `%${event.name.split(" at ")[0]}%`),
      });

      if (!artist) {
        // Create a placeholder artist if not found
        await db.insert(artists).values({
          id: crypto.randomUUID(),
          name: event.name.split(" at ")[0],
          image_url: null,
          followers: null,
          popularity: null,
          genres: [],
          spotify_url: null,
          last_updated: new Date(),
        });
      }

      const artistId =
        artist?.id ||
        (await db.query.artists.findFirst({
          where: (artists, { like }) =>
            like(artists.name, `%${event.name.split(" at ")[0]}%`),
        }))!.id;

      // Store show
      await db
        .insert(shows)
        .values({
          id: event.id,
          name: event.name,
          date: new Date(event.dates.start.dateTime),
          venue_id: venue.id,
          artist_id: artistId,
          ticket_url: event.url,
          event_url: event.url,
          image_url:
            event.images.find((img) => img.ratio === "16_9")?.url ||
            event.images[0]?.url,
          description: null,
          last_updated: new Date(),
        })
        .onConflictDoNothing();

      // Get show again
      show = await db.query.shows.findFirst({
        where: (shows, { eq }) => eq(shows.id, id),
        with: {
          artist: true,
          venue: true,
        },
      });

      if (!show) {
        notFound();
      }

      // Create setlist if it doesn't exist
      const existingSetlist = await db.query.setlists.findFirst({
        where: (setlists, { eq }) => eq(setlists.show_id, show.id),
      });

      if (!existingSetlist) {
        await db.insert(setlists).values({
          show_id: show.id,
          name: `${show.artist.name} at ${show.venue.name}`,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching show:", error);
      notFound();
    }
  }

  return show;
}

async function ShowDetails({ id }: { id: string }) {
  const show = await getShowDetails(id);
  const user = await getUser();

  if (!show) {
    notFound();
  }

  const showDate = new Date(show.date);
  const isPastShow = showDate < new Date();

  // Get setlist songs for sharing
  const setlistSongsList = await db.query.setlistSongs.findMany({
    where: (setlistSongs, { eq }) => eq(setlistSongs.show_id, id),
    orderBy: (setlistSongs, { desc }) => desc(setlistSongs.votes),
  });

  // Prepare tabs for the SwipeTabs component
  const tabs = [
    {
      value: "setlist",
      label: "Setlist",
      content: (
        <div className="space-y-8">
          <SetlistStats showId={show.id} />
          <SetlistDisplay showId={show.id} userId={user?.id} />
          {user && <VoteNotifications showId={show.id} userId={user.id} />}
        </div>
      ),
    },
  ];

  // Add the suggest tab if the show is not past and user is logged in
  if (!isPastShow && user) {
    tabs.push({
      value: "suggest",
      label: "Suggest Songs",
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Suggest Songs</h3>
            <p className="text-muted-foreground mb-6">
              Help create the perfect setlist by suggesting songs you'd like to
              hear at the show. Your suggestions will appear in the setlist for
              others to vote on.
            </p>
            <SongSuggestion
              showId={show.id}
              artistId={show.artist_id}
              userId={user.id}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Current Setlist</h3>
            <SetlistDisplay showId={show.id} userId={user.id} />
          </div>
        </div>
      ),
    });
  }

  // Add the share tab
  tabs.push({
    value: "share",
    label: "Share",
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Share Setlist</h3>
          <p className="text-muted-foreground mb-6">
            Share this setlist with friends and fellow fans. The image below
            will update automatically as votes come in.
          </p>
        </div>
        <SetlistShareImage
          showName={show.name}
          artistName={show.artist.name}
          venueName={show.venue.name}
          venueCity={show.venue.city}
          showDate={showDate}
          songs={setlistSongsList.map((song) => ({
            id: song.id,
            name: song.title,
            votes: song.votes,
          }))}
          showUrl={`${process.env.NEXT_PUBLIC_APP_URL}/shows/${show.id}`}
        />
      </div>
    ),
  });

  return (
    <div className="container py-6 md:py-10">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/shows">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Shows
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{show.artist.name}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(showDate, "MMMM d, yyyy")}
              </div>
              <div className="flex items-center">
                <MapPinIcon className="mr-2 h-4 w-4" />
                {show.venue.name}, {show.venue.city}
              </div>
            </div>
          </div>

          {show.ticket_url && (
            <div className="flex justify-start md:justify-end">
              <Button asChild>
                <a
                  href={show.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TicketIcon className="mr-2 h-4 w-4" />
                  Get Tickets
                  <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {show.image_url && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={show.image_url}
            alt={show.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <ShowViewerCount showId={show.id} />

      <div className="mt-8">
        <SwipeTabs tabs={tabs} />
      </div>
    </div>
  );
}

export default function ShowPage({ params }: ShowPageProps) {
  return (
    <div className="container py-6 md:py-10 max-w-5xl">
      <Suspense fallback={<ShowSkeleton />}>
        <ShowDetails id={params.id} />
      </Suspense>
      <ClientSideComponents showId={params.id} />
    </div>
  );
}

// Client-side components that need to be separated from server components
function ClientSideComponents({ showId }: { showId: string }) {
  return (
    <>
      <ShowViewerCount showId={showId} className="hidden" />
      <VoteNotificationsWrapper showId={showId} />
    </>
  );
}

// Wrapper to handle user authentication client-side
("use client");
function VoteNotificationsWrapper({ showId }: { showId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    }

    getUserId();
  }, [supabase]);

  if (!userId) return null;

  return <VoteNotifications showId={showId} userId={userId} />;
}

function ShowSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Skeleton className="aspect-video w-full rounded-lg" />
        </div>

        <div className="md:w-2/3 space-y-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-full max-w-md mb-4" />
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-72 mb-2" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Separator />

      <div>
        <Skeleton className="h-8 w-48 mb-4" />

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
