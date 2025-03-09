import { NextRequest, NextResponse } from "next/server";

import { createServerOnlyDb } from "@/lib/db-server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    const db = await createServerOnlyDb();

    if (!type) {
      return NextResponse.json(
        { error: "Type parameter is required" },
        { status: 400 }
      );
    }

    let data;

    switch (type) {
      case "artists":
        if (id) {
          data = await db.query.artists.findFirst({
            where: (artists, { eq }) => eq(artists.id, id),
          });
        } else {
          data = await db.query.artists.findMany({
            limit: 10,
          });
        }
        break;

      case "shows":
        if (id) {
          data = await db.query.shows.findFirst({
            where: (shows, { eq }) => eq(shows.id, id),
            with: {
              artist: true,
              venue: true,
            },
          });
        } else {
          data = await db.query.shows.findMany({
            limit: 10,
            with: {
              artist: true,
              venue: true,
            },
          });
        }
        break;

      case "venues":
        if (id) {
          data = await db.query.venues.findFirst({
            where: (venues, { eq }) => eq(venues.id, id),
          });
        } else {
          data = await db.query.venues.findMany({
            limit: 10,
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
