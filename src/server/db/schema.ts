import { createClient } from "@supabase/supabase-js";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";

import type { AdapterAccount } from "next-auth/adapters";

import { createTable } from "./table-creator";

/* -----------------------------------------------------------------------------------------------
 * Auth tables
 * NOTE: auth tables are common to mutiple projects, remember to remove `table filters` before
 * performing any operations
 * -----------------------------------------------------------------------------------------------*/

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

/* -----------------------------------------------------------------------------------------------
 * App tables
 * -----------------------------------------------------------------------------------------------*/

export const myPlaylists = createTable("playlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  songs: text("songs").array().default("{}").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const favorites = createTable("favorite", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  songs: text("songs").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  albums: text("albums").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  playlists: text("playlists").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  artists: text("artists").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  podcasts: text("podcasts").array().unique().default("{}").notNull(),
});

// Artists table
export const artists = pgTable("artists", {
  id: uuid("id").primaryKey(), // Spotify artist ID
  name: text("name").notNull(),
  image_url: text("image_url"),
  followers: integer("followers"),
  popularity: integer("popularity"),
  genres: text("genres").array(),
  spotify_url: text("spotify_url"),
  bio: text("bio"),
  monthly_listeners: integer("monthly_listeners"),
  verified: boolean("verified").default(false),
  social_links: text("social_links").array(),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Venues table
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey(), // Ticketmaster venue ID
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  timezone: text("timezone"),
  capacity: integer("capacity"),
  address: text("address"),
  postal_code: text("postal_code"),
  url: text("url"),
  parking_info: text("parking_info"),
  accessible_seating_info: text("accessible_seating_info"),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Shows table
export const shows = pgTable("shows", {
  id: uuid("id").primaryKey(), // Ticketmaster event ID
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  venue_id: uuid("venue_id").references(() => venues.id),
  artist_id: uuid("artist_id").references(() => artists.id),
  ticket_url: text("ticket_url"),
  event_url: text("event_url"),
  image_url: text("image_url"),
  description: text("description"),
  min_price: numeric("min_price"),
  max_price: numeric("max_price"),
  currency: text("currency").default("USD"),
  total_tickets: integer("total_tickets"),
  available_tickets: integer("available_tickets"),
  status: text("status").default("scheduled"), // scheduled, on-sale, sold-out, cancelled
  last_updated: timestamp("last_updated").defaultNow(),
});

// Top tracks table (for initial setlist suggestions)
export const topTracks = pgTable("top_tracks", {
  id: uuid("id").primaryKey(), // Spotify track ID
  artist_id: uuid("artist_id")
    .references(() => artists.id)
    .notNull(),
  name: text("name").notNull(),
  album: text("album"),
  album_id: text("album_id"),
  popularity: integer("popularity"),
  preview_url: text("preview_url"),
  spotify_url: text("spotify_url"),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Setlists table
export const setlists = pgTable("setlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  show_id: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Setlist songs table (simplified from original schema to remove setlist table)
export const setlistSongs = pgTable("setlist_songs", {
  id: uuid("id").defaultRandom().primaryKey(),
  show_id: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  artist_id: uuid("artist_id")
    .references(() => artists.id)
    .notNull(),
  artist_name: text("artist_name").notNull(),
  title: text("title").notNull(),
  votes: integer("votes").default(0).notNull(),
  suggested_by: uuid("suggested_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Votes table
export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  setlist_song_id: uuid("setlist_song_id")
    .references(() => setlistSongs.id)
    .notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  show_id: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  vote_type: text("vote_type").notNull(), // 'up' or 'down'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User followed artists (for Spotify integration)
export const userFollowedArtists = pgTable("user_followed_artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  artist_id: uuid("artist_id")
    .references(() => artists.id)
    .notNull(),
  followed_at: timestamp("followed_at").defaultNow().notNull(),
});

// User top artists (for Spotify integration)
export const userTopArtists = pgTable("user_top_artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  artist_id: uuid("artist_id")
    .references(() => artists.id)
    .notNull(),
  rank: integer("rank").notNull(),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
});

/* -----------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MyPlaylist = typeof myPlaylists.$inferSelect;
export type NewPlaylist = typeof myPlaylists.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

// Relations
export const artistsRelations = relations(artists, ({ many }) => ({
  shows: many(shows),
  topTracks: many(topTracks),
  userFollowedArtists: many(userFollowedArtists),
  userTopArtists: many(userTopArtists),
  setlistSongs: many(setlistSongs),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  shows: many(shows),
}));

export const showsRelations = relations(shows, ({ one, many }) => ({
  artist: one(artists, {
    fields: [shows.artist_id],
    references: [artists.id],
  }),
  venue: one(venues, {
    fields: [shows.venue_id],
    references: [venues.id],
  }),
  setlistSongs: many(setlistSongs),
  votes: many(votes),
}));

export const setlistSongsRelations = relations(
  setlistSongs,
  ({ one, many }) => ({
    show: one(shows, {
      fields: [setlistSongs.show_id],
      references: [shows.id],
    }),
    artist: one(artists, {
      fields: [setlistSongs.artist_id],
      references: [artists.id],
    }),
    votes: many(votes),
  })
);

export const votesRelations = relations(votes, ({ one }) => ({
  setlistSong: one(setlistSongs, {
    fields: [votes.setlist_song_id],
    references: [setlistSongs.id],
  }),
  show: one(shows, {
    fields: [votes.show_id],
    references: [shows.id],
  }),
}));

export const userFollowedArtistsRelations = relations(
  userFollowedArtists,
  ({ one }) => ({
    artist: one(artists, {
      fields: [userFollowedArtists.artist_id],
      references: [artists.id],
    }),
  })
);

export const userTopArtistsRelations = relations(userTopArtists, ({ one }) => ({
  artist: one(artists, {
    fields: [userTopArtists.artist_id],
    references: [artists.id],
  }),
}));

// Add these exports to match the import names
export const top_tracks = topTracks;
export const user_followed_artists = userFollowedArtists;
export const user_top_artists = userTopArtists;
