import { NextRequest, NextResponse } from "next/server";

import {
  getArtistById,
  getArtists,
  getShows,
  getShowWithRelations,
  getVenueById,
  getVenues,
} from "@/lib/db/server-actions";

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
          const artist = await getArtistById(id);
          return NextResponse.json({ data: artist });
        } else {
          // Fetch all artists
          const allArtists = await getArtists();
          return NextResponse.json({ data: allArtists });
        }

      case "shows":
        if (id) {
          // Fetch a single show with artist and venue
          const show = await getShowWithRelations(id);
          return NextResponse.json({ data: show });
        } else {
          // Fetch all shows
          const allShows = await getShows();

          // Enrich shows with artist and venue data
          const enrichedShows = await Promise.all(
            allShows.map(async (show) => {
              return await getShowWithRelations(show.id);
            })
          );

          return NextResponse.json({ data: enrichedShows });
        }

      case "venues":
        if (id) {
          // Fetch a single venue
          const venue = await getVenueById(id);
          return NextResponse.json({ data: venue });
        } else {
          // Fetch all venues
          const allVenues = await getVenues();
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
