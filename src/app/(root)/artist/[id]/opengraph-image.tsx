import { ImageResponse } from "next/og";
import { format } from "date-fns";
import { eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { artists, shows } from "@/lib/db/schema";

export const runtime = "edge";
export const alt = "TheSet - Concert Setlist Voting";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }: { params: { id: string } }) {
  // Get artist details
  const artist = await db.query.artists.findFirst({
    where: (artists, { eq }) => eq(artists.id, params.id),
  });

  if (!artist) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#09090b",
            color: "#ffffff",
            fontFamily: "sans-serif",
            padding: 40,
          }}
        >
          <h1 style={{ fontSize: 60, fontWeight: "bold", marginBottom: 20 }}>
            TheSet
          </h1>
          <p style={{ fontSize: 30, marginBottom: 40, textAlign: "center" }}>
            Concert Discovery and Setlist Voting
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#27272a",
              borderRadius: 12,
              padding: "20px 40px",
            }}
          >
            <p style={{ fontSize: 24 }}>Artist not found</p>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Get upcoming shows
  const upcomingShows = await db.query.shows.findMany({
    where: (shows, { eq, gt }) => {
      return (
        eq(shows.artist_id, params.id) &&
        gt(shows.date, new Date().toISOString())
      );
    },
    with: {
      venue: true,
    },
    orderBy: (shows, { asc }) => asc(shows.date),
    limit: 5,
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 800,
          }}
        >
          <h1 style={{ fontSize: 60, fontWeight: "bold", marginBottom: 10 }}>
            {artist.name}
          </h1>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {artist.genres.slice(0, 5).map((genre, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#27272a",
                  borderRadius: 16,
                  padding: "4px 12px",
                  fontSize: 16,
                }}
              >
                {genre}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 20, marginBottom: 30, color: "#a1a1aa" }}>
            {artist.followers?.toLocaleString() || "Unknown"} followers on
            Spotify
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              backgroundColor: "#18181b",
              borderRadius: 12,
              padding: 24,
              marginBottom: 30,
            }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Upcoming Shows
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {upcomingShows.length > 0 ?
                upcomingShows.map((show) => (
                  <div
                    key={show.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      backgroundColor: "#27272a",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <p style={{ fontSize: 20, fontWeight: "bold" }}>
                        {show.venue.name}
                      </p>
                      <p style={{ fontSize: 16, color: "#a1a1aa" }}>
                        {show.venue.city}
                        {show.venue.state && `, ${show.venue.state}`}
                      </p>
                    </div>
                    <p style={{ fontSize: 18 }}>
                      {format(new Date(show.date), "MMM d, yyyy")}
                    </p>
                  </div>
                ))
              : <p
                  style={{
                    fontSize: 20,
                    textAlign: "center",
                    color: "#a1a1aa",
                  }}
                >
                  No upcoming shows found
                </p>
              }
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            bottom: 30,
            width: "100%",
          }}
        >
          <p style={{ fontSize: 16, color: "#a1a1aa" }}>
            Generated by TheSet - The Concert Setlist Voting Platform
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
