"use server";

import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env.mjs";
import * as schema from "./db/schema";
import {
  artists,
  setlistSongs,
  shows,
  topTracks,
  userFollowedArtists,
  userTopArtists,
  venues,
  votes,
} from "./db/schema";

// This function only runs on the server
export async function createServerOnlyDb() {
  const connectionString = env.DATABASE_URL;
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
  });
  return drizzle(client, { schema });
}

// Helper function to perform database queries on the server
export async function performDbQuery<T>(
  queryFn: (db: ReturnType<typeof createServerOnlyDb>) => Promise<T>
): Promise<T> {
  const db = await createServerOnlyDb();
  return queryFn(db);
}

/**
 * Enhanced database access for server components
 * These functions use the performDbQuery helper to ensure proper connection management
 */
export const serverDb = {
  // Artists
  artists: {
    findMany: async (limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db.select().from(artists);
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    findUnique: async (id: string) => {
      return performDbQuery(async (db) => {
        const result = await db
          .select()
          .from(artists)
          .where(eq(artists.id, id))
          .limit(1);
        return result[0] || null;
      });
    },
    findByName: async (name: string, limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db
          .select()
          .from(artists)
          .where(like(artists.name, `%${name}%`));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    create: async (data: typeof artists.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(artists).values(data).returning();
      });
    },
    update: async (id: string, data: Partial<typeof artists.$inferInsert>) => {
      return performDbQuery(async (db) => {
        return db
          .update(artists)
          .set(data)
          .where(eq(artists.id, id))
          .returning();
      });
    },
    delete: async (id: string) => {
      return performDbQuery(async (db) => {
        return db.delete(artists).where(eq(artists.id, id)).returning();
      });
    },
  },

  // Venues
  venues: {
    findMany: async (limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db.select().from(venues);
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    findUnique: async (id: string) => {
      return performDbQuery(async (db) => {
        const result = await db
          .select()
          .from(venues)
          .where(eq(venues.id, id))
          .limit(1);
        return result[0] || null;
      });
    },
    findByCity: async (city: string, limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db
          .select()
          .from(venues)
          .where(like(venues.city, `%${city}%`));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    create: async (data: typeof venues.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(venues).values(data).returning();
      });
    },
    update: async (id: string, data: Partial<typeof venues.$inferInsert>) => {
      return performDbQuery(async (db) => {
        return db.update(venues).set(data).where(eq(venues.id, id)).returning();
      });
    },
    delete: async (id: string) => {
      return performDbQuery(async (db) => {
        return db.delete(venues).where(eq(venues.id, id)).returning();
      });
    },
  },

  // Shows
  shows: {
    findMany: async (limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db.select().from(shows);
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    findUnique: async (id: string) => {
      return performDbQuery(async (db) => {
        const result = await db
          .select()
          .from(shows)
          .where(eq(shows.id, id))
          .limit(1);
        return result[0] || null;
      });
    },
    findByArtist: async (artistId: string, limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db
          .select()
          .from(shows)
          .where(eq(shows.artist_id, artistId));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    findByVenue: async (venueId: string, limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db
          .select()
          .from(shows)
          .where(eq(shows.venue_id, venueId));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    findUpcoming: async (limit?: number) => {
      return performDbQuery(async (db) => {
        const now = new Date();
        const query = db
          .select()
          .from(shows)
          .where(sql`${shows.date} > ${now}`)
          .orderBy(asc(shows.date));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    create: async (data: typeof shows.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(shows).values(data).returning();
      });
    },
    update: async (id: string, data: Partial<typeof shows.$inferInsert>) => {
      return performDbQuery(async (db) => {
        return db.update(shows).set(data).where(eq(shows.id, id)).returning();
      });
    },
    delete: async (id: string) => {
      return performDbQuery(async (db) => {
        return db.delete(shows).where(eq(shows.id, id)).returning();
      });
    },
    // Get show with artist and venue
    findWithRelations: async (id: string) => {
      const show = await serverDb.shows.findUnique(id);
      if (!show) return null;

      const artist = await serverDb.artists.findUnique(show.artist_id);
      const venue = await serverDb.venues.findUnique(show.venue_id);

      return performDbQuery(async (db) => {
        const setlist = await db
          .select()
          .from(setlistSongs)
          .where(eq(setlistSongs.show_id, id));

        return {
          ...show,
          artist,
          venue,
          setlist_songs: setlist,
        };
      });
    },
  },

  // Setlist songs
  setlistSongs: {
    findByShow: async (showId: string) => {
      return performDbQuery(async (db) => {
        return db
          .select()
          .from(setlistSongs)
          .where(eq(setlistSongs.show_id, showId))
          .orderBy(asc(setlistSongs.position));
      });
    },
    findUnique: async (id: string) => {
      return performDbQuery(async (db) => {
        const result = await db
          .select()
          .from(setlistSongs)
          .where(eq(setlistSongs.id, id))
          .limit(1);
        return result[0] || null;
      });
    },
    create: async (data: typeof setlistSongs.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(setlistSongs).values(data).returning();
      });
    },
    update: async (
      id: string,
      data: Partial<typeof setlistSongs.$inferInsert>
    ) => {
      return performDbQuery(async (db) => {
        return db
          .update(setlistSongs)
          .set(data)
          .where(eq(setlistSongs.id, id))
          .returning();
      });
    },
    delete: async (id: string) => {
      return performDbQuery(async (db) => {
        return db
          .delete(setlistSongs)
          .where(eq(setlistSongs.id, id))
          .returning();
      });
    },
    incrementVotes: async (id: string) => {
      return performDbQuery(async (db) => {
        return db
          .update(setlistSongs)
          .set({ votes: sql`${setlistSongs.votes} + 1` })
          .where(eq(setlistSongs.id, id))
          .returning();
      });
    },
  },

  // Votes
  votes: {
    findByUser: async (userId: string) => {
      return performDbQuery(async (db) => {
        return db.select().from(votes).where(eq(votes.user_id, userId));
      });
    },
    findBySetlistSong: async (setlistSongId: string) => {
      return performDbQuery(async (db) => {
        return db
          .select()
          .from(votes)
          .where(eq(votes.setlist_song_id, setlistSongId));
      });
    },
    findByUserAndSetlistSong: async (userId: string, setlistSongId: string) => {
      return performDbQuery(async (db) => {
        const result = await db
          .select()
          .from(votes)
          .where(
            and(
              eq(votes.user_id, userId),
              eq(votes.setlist_song_id, setlistSongId)
            )
          )
          .limit(1);
        return result[0] || null;
      });
    },
    create: async (data: typeof votes.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(votes).values(data).returning();
      });
    },
    delete: async (id: string) => {
      return performDbQuery(async (db) => {
        return db.delete(votes).where(eq(votes.id, id)).returning();
      });
    },
  },

  // User followed artists
  userFollowedArtists: {
    findByUser: async (userId: string) => {
      return performDbQuery(async (db) => {
        return db
          .select()
          .from(userFollowedArtists)
          .where(eq(userFollowedArtists.user_id, userId));
      });
    },
    findByUserWithArtist: async (userId: string) => {
      const followed = await serverDb.userFollowedArtists.findByUser(userId);

      // Get artist details for each followed artist
      const artistsWithDetails = await Promise.all(
        followed.map(async (item) => {
          const artist = await serverDb.artists.findUnique(item.artist_id);
          return {
            ...item,
            artist,
          };
        })
      );

      return artistsWithDetails;
    },
    create: async (data: typeof userFollowedArtists.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(userFollowedArtists).values(data).returning();
      });
    },
    delete: async (userId: string, artistId: string) => {
      return performDbQuery(async (db) => {
        return db
          .delete(userFollowedArtists)
          .where(
            and(
              eq(userFollowedArtists.user_id, userId),
              eq(userFollowedArtists.artist_id, artistId)
            )
          )
          .returning();
      });
    },
  },

  // Top tracks
  topTracks: {
    findByArtist: async (artistId: string, limit?: number) => {
      return performDbQuery(async (db) => {
        const query = db
          .select()
          .from(topTracks)
          .where(eq(topTracks.artist_id, artistId))
          .orderBy(desc(topTracks.popularity));
        if (limit) {
          query.limit(limit);
        }
        return query;
      });
    },
    create: async (data: typeof topTracks.$inferInsert) => {
      return performDbQuery(async (db) => {
        return db.insert(topTracks).values(data).returning();
      });
    },
    deleteByArtist: async (artistId: string) => {
      return performDbQuery(async (db) => {
        return db
          .delete(topTracks)
          .where(eq(topTracks.artist_id, artistId))
          .returning();
      });
    },
  },
};
