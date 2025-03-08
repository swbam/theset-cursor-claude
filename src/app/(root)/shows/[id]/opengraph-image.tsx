import { ImageResponse } from "next/og";
import { format } from "date-fns";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { shows } from "@/lib/db/schema";

export const runtime = "edge";
export const alt = "TheSet - Concert Setlist Voting";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }: { params: { id: string } }) {
  // Get show details
  const show = await db.query.shows.findFirst({
    where: (shows, { eq }) => eq(shows.id, params.id),
    with: {
      artist: true,
      venue: true,
    },
  });

  if (!show) {
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
            <p style={{ fontSize: 24 }}>Show not found</p>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Get setlist songs
  const setlistSongs = await db.query.setlist_songs.findMany({
    where: (setlistSongs, { eq }) => eq(setlistSongs.show_id, params.id),
    orderBy: (setlistSongs, { desc }) => desc(setlistSongs.votes),
    limit: 10,
  });

  const showDate = new Date(show.date);

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
          <h1 style={{ fontSize: 48, fontWeight: "bold", marginBottom: 10 }}>
            {show.artist.name}
          </h1>
          <p style={{ fontSize: 24, marginBottom: 20, color: "#a1a1aa" }}>
            {show.venue.name}, {show.venue.city}
          </p>
          <p style={{ fontSize: 20, marginBottom: 30, color: "#a1a1aa" }}>
            {format(showDate, "EEEE, MMMM d, yyyy")}
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
              Setlist
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {setlistSongs.length > 0 ?
                setlistSongs.map((song, index) => (
                  <div
                    key={song.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        backgroundColor: "#27272a",
                        borderRadius: "50%",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </div>
                    <p style={{ fontSize: 20, flex: 1 }}>{song.title}</p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#27272a",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: 16,
                      }}
                    >
                      {song.votes} votes
                    </div>
                  </div>
                ))
              : <p
                  style={{
                    fontSize: 20,
                    textAlign: "center",
                    color: "#a1a1aa",
                  }}
                >
                  No songs in setlist yet
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
