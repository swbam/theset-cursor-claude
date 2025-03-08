"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowUpIcon, PauseIcon, PlayIcon, Share2 } from "lucide-react";
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
  previewUrl: string | null;
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
        votes,
        top_tracks (
          preview_url
        )
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
      previewUrl: song.top_tracks?.preview_url || null,
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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [showDetails, setShowDetails] = useState<{
    name: string;
    artist: string;
    venue: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSetlist() {
      setLoading(true);
      const setlistSongs = await getSetlistDetails(showId, userId);
      setSongs(setlistSongs);
      setLoading(false);
    }

    async function fetchShowDetails() {
      try {
        const { data: show, error } = await supabase
          .from("shows")
          .select(
            `
            name,
            artists (name),
            venues (name)
          `
          )
          .eq("id", showId)
          .single();

        if (error) throw error;

        setShowDetails({
          name: show.name,
          artist: show.artists.name,
          venue: show.venues.name,
        });
      } catch (error) {
        console.error("Error fetching show details:", error);
      }
    }

    fetchSetlist();
    fetchShowDetails();

    // Set up real-time subscription for votes
    const channel = supabase
      .channel("setlist-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_songs",
          filter: `show_id=eq.${showId}`,
        },
        () => {
          fetchSetlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [showId, userId]);

  async function handleVote(songId: string) {
    if (!userId) {
      toast.error("Please log in to vote on setlists");
      return;
    }

    try {
      // Check if user has already voted for this song
      const songIndex = songs.findIndex((song) => song.id === songId);
      const hasVoted = songs[songIndex].hasVoted;

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("user_id", userId)
          .eq("setlist_song_id", songId);

        if (error) throw error;

        // Update song votes count
        await supabase.rpc("decrement_song_votes", { song_id: songId });

        // Update local state
        const updatedSongs = [...songs];
        updatedSongs[songIndex] = {
          ...updatedSongs[songIndex],
          votes: updatedSongs[songIndex].votes - 1,
          hasVoted: false,
        };
        setSongs(updatedSongs);

        toast.success("Vote removed");
      } else {
        // Add vote
        const { error } = await supabase.from("votes").insert({
          user_id: userId,
          setlist_song_id: songId,
          show_id: showId,
          vote_type: "up",
          created_at: new Date(),
        });

        if (error) throw error;

        // Update song votes count
        await supabase.rpc("increment_song_votes", {
          song_id: songId,
          vote_value: 1,
        });

        // Update local state
        const updatedSongs = [...songs];
        updatedSongs[songIndex] = {
          ...updatedSongs[songIndex],
          votes: updatedSongs[songIndex].votes + 1,
          hasVoted: true,
        };
        setSongs(updatedSongs);

        toast.success("Vote added");
      }

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to register vote");
    }
  }

  function handlePlayPreview(trackId: string, previewUrl: string | null) {
    if (!previewUrl) {
      toast.error("No preview available for this song");
      return;
    }

    if (currentlyPlaying === trackId) {
      // Stop playing
      if (audio) {
        audio.pause();
      }
      setCurrentlyPlaying(null);
    } else {
      // Stop current audio if playing
      if (audio) {
        audio.pause();
      }

      // Play new audio
      const newAudio = new Audio(previewUrl);
      newAudio.play();
      newAudio.onended = () => {
        setCurrentlyPlaying(null);
      };

      setAudio(newAudio);
      setCurrentlyPlaying(trackId);
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
      <div className="flex justify-end">
        <ShareButton
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/shows/${showId}`}
          title={
            showDetails ?
              `${showDetails.artist} at ${showDetails.venue} - Setlist`
            : "Setlist"
          }
          description={
            showDetails ?
              `Check out the setlist for ${showDetails.artist} at ${showDetails.venue} on TheSet!`
            : "Check out this setlist on TheSet!"
          }
          size="sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Song</TableHead>
            <TableHead className="w-20 text-right">Votes</TableHead>
            <TableHead className="w-20 text-center">Preview</TableHead>
            <TableHead className="w-20 text-center">Vote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song, index) => (
            <TableRow key={song.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{song.name}</TableCell>
              <TableCell className="text-right">{song.votes}</TableCell>
              <TableCell className="text-center">
                {song.previewUrl ?
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handlePlayPreview(song.trackId, song.previewUrl)
                    }
                  >
                    {currentlyPlaying === song.trackId ?
                      <PauseIcon className="h-4 w-4" />
                    : <PlayIcon className="h-4 w-4" />}
                  </Button>
                : <span className="text-muted-foreground text-sm">-</span>}
              </TableCell>
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
