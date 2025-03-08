import { createClient } from "@supabase/supabase-js";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
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
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  username: text("username"),
  created_at: timestamp("created_at").defaultNow(),
  name: text("name"),
  image: text("image"),
  email_verified: timestamp("email_verified"),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

/* -----------------------------------------------------------------------------------------------
 * App tables
 * -----------------------------------------------------------------------------------------------*/

export const myPlaylists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  songs: json("songs").default([]),
});

export const favorites = pgTable("favorite", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  itemId: text("itemId").notNull(),
  itemType: text("itemType").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// Artists table
export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  image_url: text("image_url"),
  followers: integer("followers"),
  popularity: integer("popularity"),
  genres: json("genres").default([]),
  spotify_url: text("spotify_url"),
  bio: text("bio"),
  monthly_listeners: integer("monthly_listeners"),
  verified: boolean("verified").default(false),
  social_links: json("social_links").default({}),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Venues table
export const venues = pgTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  country: text("country"),
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
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status"),
  date: timestamp("date").notNull(),
  description: text("description"),
  image_url: text("image_url"),
  venue_id: text("venue_id").references(() => venues.id),
  artist_id: text("artist_id").references(() => artists.id),
  ticket_url: text("ticket_url"),
  event_url: text("event_url"),
  min_price: numeric("min_price"),
  max_price: numeric("max_price"),
  currency: text("currency"),
  total_tickets: integer("total_tickets"),
  available_tickets: integer("available_tickets"),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Top tracks table (for initial setlist suggestions)
export const topTracks = pgTable("top_tracks", {
  id: text("id").primaryKey(),
  artist_id: text("artist_id")
    .references(() => artists.id)
    .notNull(),
  name: text("name").notNull(),
  spotify_id: text("spotify_id").notNull(),
  preview_url: text("preview_url"),
  popularity: integer("popularity"),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Setlists table
export const setlists = pgTable("setlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  show_id: text("show_id")
    .references(() => shows.id)
    .notNull(),
  is_official: boolean("is_official").default(false),
  total_votes: integer("total_votes").default(0),
  created_at: timestamp("created_at").defaultNow(),
  last_updated: timestamp("last_updated").defaultNow(),
});

// Setlist songs table (simplified from original schema to remove setlist table)
export const setlistSongs = pgTable("setlist_songs", {
  id: uuid("id").defaultRandom().primaryKey(),
  show_id: text("show_id")
    .references(() => shows.id)
    .notNull(),
  setlist_id: uuid("setlist_id").references(() => setlists.id),
  track_id: text("track_id").references(() => topTracks.id),
  artist_id: text("artist_id").references(() => artists.id),
  artist_name: text("artist_name").notNull(),
  title: text("title").notNull(),
  votes: integer("votes").default(0).notNull(),
  position: integer("position"),
  suggested_by: uuid("suggested_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Votes table
export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  setlist_song_id: uuid("setlist_song_id")
    .references(() => setlistSongs.id)
    .notNull(),
  show_id: text("show_id")
    .references(() => shows.id)
    .notNull(),
  vote_type: text("vote_type").default("up"),
  created_at: timestamp("created_at").defaultNow(),
});

// User-followed artists (from Spotify)
export const userFollowedArtists = pgTable("user_followed_artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  artist_id: text("artist_id")
    .references(() => artists.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow(),
  last_updated: timestamp("last_updated").defaultNow(),
});

// User's top artists (from Spotify)
export const userTopArtists = pgTable("user_top_artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  artist_id: text("artist_id")
    .references(() => artists.id)
    .notNull(),
  rank: integer("rank").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  last_updated: timestamp("last_updated").defaultNow(),
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
export const artistsRelations = relations(artists, ({ one, many }) => ({
  venues: many(venues),
  shows: many(shows),
  topTracks: many(topTracks),
  setlistSongs: many(setlistSongs),
  userTopArtists: many(userTopArtists),
  userFollowedArtists: many(userFollowedArtists),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  shows: many(shows),
}));

export const showsRelations = relations(shows, ({ one, many }) => ({
  venue: one(venues, {
    fields: [shows.venue_id],
    references: [venues.id],
  }),
  artist: one(artists, {
    fields: [shows.artist_id],
    references: [artists.id],
  }),
  setlists: many(setlists),
  setlistSongs: many(setlistSongs),
  votes: many(votes),
}));

export const setlistsRelations = relations(setlists, ({ one, many }) => ({
  show: one(shows, {
    fields: [setlists.show_id],
    references: [shows.id],
  }),
  songs: many(setlistSongs),
}));

export const setlistSongsRelations = relations(
  setlistSongs,
  ({ one, many }) => ({
    show: one(shows, {
      fields: [setlistSongs.show_id],
      references: [shows.id],
    }),
    setlist: one(setlists, {
      fields: [setlistSongs.setlist_id],
      references: [setlists.id],
    }),
    track: one(topTracks, {
      fields: [setlistSongs.track_id],
      references: [topTracks.id],
    }),
    artist: one(artists, {
      fields: [setlistSongs.artist_id],
      references: [artists.id],
    }),
    user: one(users, {
      fields: [setlistSongs.suggested_by],
      references: [users.id],
    }),
    votes: many(votes),
  })
);

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.user_id],
    references: [users.id],
  }),
  setlistSong: one(setlistSongs, {
    fields: [votes.setlist_song_id],
    references: [setlistSongs.id],
  }),
  show: one(shows, {
    fields: [votes.show_id],
    references: [shows.id],
  }),
}));

export const userTopArtistsRelations = relations(userTopArtists, ({ one }) => ({
  user: one(users, {
    fields: [userTopArtists.user_id],
    references: [users.id],
  }),
  artist: one(artists, {
    fields: [userTopArtists.artist_id],
    references: [artists.id],
  }),
}));

export const userFollowedArtistsRelations = relations(
  userFollowedArtists,
  ({ one }) => ({
    user: one(users, {
      fields: [userFollowedArtists.user_id],
      references: [users.id],
    }),
    artist: one(artists, {
      fields: [userFollowedArtists.artist_id],
      references: [artists.id],
    }),
  })
);

// Add these exports to match the import names
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;

export type Show = typeof shows.$inferSelect;
export type NewShow = typeof shows.$inferInsert;

export type TopTrack = typeof topTracks.$inferSelect;
export type NewTopTrack = typeof topTracks.$inferInsert;

export type Setlist = typeof setlists.$inferSelect;
export type NewSetlist = typeof setlists.$inferInsert;

export type SetlistSong = typeof setlistSongs.$inferSelect;
export type NewSetlistSong = typeof setlistSongs.$inferInsert;

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

export type UserFollowedArtist = typeof userFollowedArtists.$inferSelect;
export type NewUserFollowedArtist = typeof userFollowedArtists.$inferInsert;

export type UserTopArtist = typeof userTopArtists.$inferSelect;
export type NewUserTopArtist = typeof userTopArtists.$inferInsert;
