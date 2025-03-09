"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchArtists, fetchShows } from "@/lib/data-fetching";
import { Artist, Show } from "@/types";

export function ClientDataExample() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [artistsData, showsData] = await Promise.all([
          fetchArtists(),
          fetchShows(),
        ]);

        setArtists(artistsData);
        setShows(showsData);
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Client-Side Data Example</h2>

      <Tabs defaultValue="artists">
        <TabsList>
          <TabsTrigger value="artists">Artists ({artists.length})</TabsTrigger>
          <TabsTrigger value="shows">Shows ({shows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="artists" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <Card key={artist.id}>
                <CardHeader>
                  <CardTitle>{artist.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Genres: {artist.genres.join(", ")}
                    </div>
                  )}
                  {artist.followers !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      Followers: {artist.followers.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shows" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shows.map((show) => (
              <Card key={show.id}>
                <CardHeader>
                  <CardTitle>{show.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Date: {new Date(show.date).toLocaleDateString()}
                  </div>
                  {show.artist && (
                    <div className="text-sm text-muted-foreground">
                      Artist: {show.artist.name}
                    </div>
                  )}
                  {show.venue && (
                    <div className="text-sm text-muted-foreground">
                      Venue: {show.venue.name}, {show.venue.city}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
