"use server";

// Missing sql import
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "./index";
import * as schema from "./schema";

/**
 * Server actions for database operations
 * These functions can be called directly from client components
 */

// Artists
export async function getArtists(limit?: number) {
  const query = db.select().from(schema.artists);
  if (limit) {
    query.limit(limit);
  }
  return query;
}

export async function getArtistById(id: string) {
  const result = await db
    .select()
    .from(schema.artists)
    .where(eq(schema.artists.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createArtist(data: typeof schema.artists.$inferInsert) {
  return db.insert(schema.artists).values(data).returning();
}

// Shows
export async function getShows(limit?: number) {
  const query = db.select().from(schema.shows);
  if (limit) {
    query.limit(limit);
  }
  return query;
}

export async function getShowById(id: string) {
  const result = await db
    .select()
    .from(schema.shows)
    .where(eq(schema.shows.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getShowWithRelations(id: string) {
  const show = await getShowById(id);
  if (!show) return null;

  const artist = await getArtistById(show.artist_id);
  const venue = await getVenueById(show.venue_id);
  const setlist = await getSetlistSongsByShowId(id);

  return {
    ...show,
    artist,
    venue,
    setlist_songs: setlist,
  };
}

// Venues
export async function getVenues(limit?: number) {
  const query = db.select().from(schema.venues);
  if (limit) {
    query.limit(limit);
  }
  return query;
}

export async function getVenueById(id: string) {
  const result = await db
    .select()
    .from(schema.venues)
    .where(eq(schema.venues.id, id))
    .limit(1);
  return result[0] || null;
}

// Setlist Songs
export async function getSetlistSongsByShowId(showId: string) {
  return db
    .select()
    .from(schema.setlistSongs)
    .where(eq(schema.setlistSongs.show_id, showId))
    .orderBy(asc(schema.setlistSongs.position));
}

export async function voteForSetlistSong(songId: string, userId: string) {
  // Check if user has already voted
  const existingVote = await db
    .select()
    .from(schema.votes)
    .where(
      and(
        eq(schema.votes.setlist_song_id, songId),
        eq(schema.votes.user_id, userId)
      )
    )
    .limit(1);

  if (existingVote.length > 0) {
    // User already voted, return existing vote
    return { alreadyVoted: true, vote: existingVote[0] };
  }

  // Create new vote
  const newVote = await db
    .insert(schema.votes)
    .values({
      user_id: userId,
      setlist_song_id: songId,
    })
    .returning();

  // Increment song vote count
  await db
    .update(schema.setlistSongs)
    .set({ votes: sql`${schema.setlistSongs.votes} + 1` })
    .where(eq(schema.setlistSongs.id, songId));

  return { alreadyVoted: false, vote: newVote[0] };
}
