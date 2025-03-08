import { NextRequest, NextResponse } from "next/server";
import { eq, like, or } from "drizzle-orm";

import { searchArtists } from "@/lib/api/spotify";
import { db } from "@/lib/db";
import { artists } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  try {
    // First, search in our database
    const dbArtists = await db.query.artists.findMany({
      where: or(like(artists.name, `%${query}%`), eq(artists.id, query)),
      orderBy: (artists, { desc }) => desc(artists.popularity),
      limit: 20,
    });

    // If we have enough results, return them
    if (dbArtists.length >= 5) {
      return NextResponse.json(dbArtists);
    }

    // Otherwise, search Spotify API
    const spotifyResults = await searchArtists(query);

    // Store new artists in database
    for (const artist of spotifyResults.artists.items) {
      await db
        .insert(artists)
        .values({
          id: artist.id,
          name: artist.name,
          image_url: artist.images[0]?.url || null,
          followers: artist.followers.total,
          popularity: artist.popularity,
          genres: artist.genres,
          spotify_url: artist.external_urls.spotify,
          last_updated: new Date(),
        })
        .onConflictDoUpdate({
          target: artists.id,
          set: {
            name: artist.name,
            image_url: artist.images[0]?.url || null,
            followers: artist.followers.total,
            popularity: artist.popularity,
            genres: artist.genres,
            spotify_url: artist.external_urls.spotify,
            last_updated: new Date(),
          },
        });
    }

    // Return combined results, removing duplicates
    const spotifyArtists = spotifyResults.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.images[0]?.url || null,
      followers: artist.followers.total,
      popularity: artist.popularity,
      genres: artist.genres,
      spotify_url: artist.external_urls.spotify,
      last_updated: new Date(),
    }));

    const allArtists = [...dbArtists, ...spotifyArtists];
    const uniqueArtists = Array.from(
      new Map(allArtists.map((artist) => [artist.id, artist])).values()
    );

    return NextResponse.json(uniqueArtists);
  } catch (error) {
    console.error("Error searching artists:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}
