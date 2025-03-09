"use server";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { artists, setlistSongs, shows, venues } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    );
  }

  try {
    // Handle different data types
    switch (type) {
      case "artists":
        if (id) {
          // Fetch a single artist
          const artist = await db
            .select()
            .from(artists)
            .where(eq(artists.id, id))
            .limit(1);
          return NextResponse.json({ data: artist[0] || null });
        } else {
          // Fetch all artists
          const allArtists = await db.select().from(artists);
          return NextResponse.json({ data: allArtists });
        }

      case "shows":
        if (id) {
          // Fetch a single show with artist and venue
          const show = await db
            .select()
            .from(shows)
            .where(eq(shows.id, id))
            .limit(1);

          if (!show[0]) {
            return NextResponse.json({ data: null });
          }

          // Get the artist
          const artist = await db
            .select()
            .from(artists)
            .where(eq(artists.id, show[0].artist_id))
            .limit(1);

          // Get the venue
          const venue = await db
            .select()
            .from(venues)
            .where(eq(venues.id, show[0].venue_id))
            .limit(1);

          // Get setlist songs
          const setlist = await db
            .select()
            .from(setlistSongs)
            .where(eq(setlistSongs.show_id, id));

          // Combine the data
          const enrichedShow = {
            ...show[0],
            artist: artist[0] || null,
            venue: venue[0] || null,
            setlist_songs: setlist || [],
          };

          return NextResponse.json({ data: enrichedShow });
        } else {
          // Fetch all shows with artist and venue
          const allShows = await db.select().from(shows);

          // Enrich shows with artist and venue data
          const enrichedShows = await Promise.all(
            allShows.map(async (show) => {
              const artist = await db
                .select()
                .from(artists)
                .where(eq(artists.id, show.artist_id))
                .limit(1);
              const venue = await db
                .select()
                .from(venues)
                .where(eq(venues.id, show.venue_id))
                .limit(1);

              return {
                ...show,
                artist: artist[0] || null,
                venue: venue[0] || null,
              };
            })
          );

          return NextResponse.json({ data: enrichedShows });
        }

      case "venues":
        if (id) {
          // Fetch a single venue
          const venue = await db
            .select()
            .from(venues)
            .where(eq(venues.id, id))
            .limit(1);
          return NextResponse.json({ data: venue[0] || null });
        } else {
          // Fetch all venues
          const allVenues = await db.select().from(venues);
          return NextResponse.json({ data: allVenues });
        }

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
