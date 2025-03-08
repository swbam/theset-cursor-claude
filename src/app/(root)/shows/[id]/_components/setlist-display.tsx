"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";

import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { setlists, setlistSongs, topTracks, votes } from "@/lib/db/schema";

// Initialize Supabase client
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type SetlistSong = {
  id: string;
  name: string;
  votes: number;
  hasVoted: boolean;
  trackId: string;
};

interface SetlistDisplayProps {
  showId: string;
  userId?: string;
}

async function getSetlistDetails(showId: string, userId?: string) {
  try {
    // Fetch setlist songs with vote counts
    const { data: songs, error } = await supabase
      .from("setlist_songs")
      .select(
        `
        id,
        title,
        track_id,
        votes
      `
      )
      .eq("show_id", showId)
      .order("votes", { ascending: false });

    if (error) throw error;

    // If user is logged in, check which songs they've voted for
    let userVotes: Record<string, boolean> = {};

    if (userId) {
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("setlist_song_id")
        .eq("user_id", userId)
        .eq("show_id", showId);

      if (votesError) throw votesError;

      userVotes = votes.reduce(
        (acc, vote) => {
          acc[vote.setlist_song_id] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );
    }

    // Format the songs with vote information
    return songs.map((song) => ({
      id: song.id,
      name: song.title,
      votes: song.votes,
      hasVoted: !!userVotes[song.id],
      trackId: song.track_id,
    }));
  } catch (error) {
    console.error("Error fetching setlist:", error);
    return [];
  }
}

export function SetlistDisplay({ showId, userId }: SetlistDisplayProps) {
  const router = useRouter();
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<any>(null);

  useEffect(() => {
    fetchSetlist();
    fetchShowDetails();
  }, [showId, userId]);

  async function fetchSetlist() {
    try {
      setLoading(true);
      const songsData = await getSetlistDetails(showId, userId);
      setSongs(songsData);
    } catch (error) {
      console.error("Error fetching setlist:", error);
      toast.error("Failed to load setlist");
    } finally {
      setLoading(false);
    }
  }

  async function fetchShowDetails() {
    try {
      const { data: show, error } = await supabase
        .from("shows")
        .select(
          `
          id,
          name,
          date,
          artist:artist_id (
            id,
            name
          ),
          venue:venue_id (
            id,
            name,
            city
          )
        `
        )
        .eq("id", showId)
        .single();

      if (error) throw error;
      setShowDetails(show);
    } catch (error) {
      console.error("Error fetching show details:", error);
    }
  }

  async function handleVote(songId: string) {
    if (!userId) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      // Check if user has already voted for this song
      const { data: existingVote, error: checkError } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", userId)
        .eq("setlist_song_id", songId)
        .eq("show_id", showId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) throw deleteError;

        // Update song votes count
        const { error: updateError } = await supabase.rpc(
          "decrement_song_votes",
          {
            song_id: songId,
          }
        );

        if (updateError) throw updateError;

        // Update local state
        setSongs((prev) =>
          prev.map((song) =>
            song.id === songId ?
              { ...song, votes: song.votes - 1, hasVoted: false }
            : song
          )
        );

        toast.success("Vote removed");
      } else {
        // Add vote
        const { error: insertError } = await supabase.from("votes").insert({
          user_id: userId,
          setlist_song_id: songId,
          show_id: showId,
        });

        if (insertError) throw insertError;

        // Update song votes count
        const { error: updateError } = await supabase.rpc(
          "increment_song_votes",
          {
            song_id: songId,
            vote_value: 1,
          }
        );

        if (updateError) throw updateError;

        // Update local state
        setSongs((prev) =>
          prev.map((song) =>
            song.id === songId ?
              { ...song, votes: song.votes + 1, hasVoted: true }
            : song
          )
        );

        toast.success("Vote added");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to process vote");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-2">No songs in setlist yet</h3>
        <p className="text-muted-foreground">
          Be the first to suggest songs for this setlist!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDetails && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Setlist</h3>
          <ShareButton
            url={`${env.NEXT_PUBLIC_APP_URL}/shows/${showId}`}
            title={`${showDetails.artist.name} at ${showDetails.venue.name}`}
            description={`Check out this setlist on TheSet!`}
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Song</TableHead>
            <TableHead className="text-right">Votes</TableHead>
            <TableHead className="text-center w-20">Vote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song, index) => (
            <TableRow key={song.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{song.name}</TableCell>
              <TableCell className="text-right">{song.votes}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVote(song.id)}
                  disabled={!userId}
                >
                  <ArrowUpIcon
                    className={
                      song.hasVoted ? "text-primary" : "text-muted-foreground"
                    }
                  />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
