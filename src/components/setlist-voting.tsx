"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Music, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
  userVoted: boolean;
  suggestedBy: string | null;
}

interface SetlistVotingProps {
  showId: string;
  artistId: string;
  isAuthenticated: boolean;
}

export function SetlistVoting({
  showId,
  artistId,
  isAuthenticated,
}: SetlistVotingProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSong, setNewSong] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentVotes, setRecentVotes] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchSetlist();

    // Set up real-time subscription
    const channel = supabase
      .channel(`setlist-${showId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_songs",
          filter: `show_id=eq.${showId}`,
        },
        (payload) => {
          fetchSetlist();

          // Show vote animation
          if (payload.eventType === "UPDATE") {
            const oldVotes = payload.old.votes || 0;
            const newVotes = payload.new.votes || 0;
            const diff = newVotes - oldVotes;

            if (diff !== 0) {
              setRecentVotes((prev) => ({
                ...prev,
                [payload.new.id]: diff,
              }));

              // Clear the animation after a delay
              setTimeout(() => {
                setRecentVotes((prev) => {
                  const next = { ...prev };
                  delete next[payload.new.id];
                  return next;
                });
              }, 2000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId]);

  const fetchSetlist = async () => {
    try {
      setLoading(true);

      // Get setlist songs
      const { data: setlistSongs, error } = await supabase
        .from("setlist_songs")
        .select(
          `
          id,
          title,
          artist_name,
          votes,
          suggested_by,
          users (
            email
          )
        `
        )
        .eq("show_id", showId)
        .order("votes", { ascending: false });

      if (error) throw error;

      // Get user votes if authenticated
      let userVotes: Record<string, boolean> = {};

      if (isAuthenticated) {
        const { data: user } = await supabase.auth.getUser();

        if (user) {
          const { data: votes } = await supabase
            .from("votes")
            .select("setlist_song_id")
            .eq("user_id", user.user.id)
            .eq("show_id", showId);

          if (votes) {
            userVotes = votes.reduce(
              (acc, vote) => {
                acc[vote.setlist_song_id] = true;
                return acc;
              },
              {} as Record<string, boolean>
            );
          }
        }
      }

      // Format songs with user vote status
      const formattedSongs =
        setlistSongs?.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist_name,
          votes: song.votes,
          userVoted: !!userVotes[song.id],
          suggestedBy: song.users?.email?.split("@")[0] || null,
        })) || [];

      setSongs(formattedSongs);
    } catch (error) {
      console.error("Error fetching setlist:", error);
      toast({
        title: "Error",
        description: "Failed to load setlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (songId: string, direction: "up" | "down") => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on setlist songs.",
        variant: "default",
      });
      router.push("/login");
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Unable to verify your account. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      // Optimistically update UI
      setSongs((prev) =>
        prev.map((song) => {
          if (song.id === songId) {
            const voteChange = direction === "up" ? 1 : -1;
            return {
              ...song,
              votes: song.userVoted ? song.votes - 1 : song.votes + voteChange,
              userVoted: !song.userVoted,
            };
          }
          return song;
        })
      );

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", user.user.id)
        .eq("setlist_song_id", songId)
        .single();

      if (existingVote) {
        // Remove vote
        await supabase.from("votes").delete().eq("id", existingVote.id);

        // Update song vote count
        await supabase.rpc("decrement_song_votes", {
          song_id: songId,
        });
      } else {
        // Add vote
        await supabase.from("votes").insert({
          user_id: user.user.id,
          setlist_song_id: songId,
          show_id: showId,
          vote_type: direction,
        });

        // Update song vote count
        await supabase.rpc("increment_song_votes", {
          song_id: songId,
          vote_value: direction === "up" ? 1 : -1,
        });
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update
      fetchSetlist();
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to suggest songs.",
        variant: "default",
      });
      router.push("/login");
      return;
    }

    if (!newSong.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song title.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { data: user } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Unable to verify your account. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      // Get artist name
      const { data: artist } = await supabase
        .from("artists")
        .select("name")
        .eq("id", artistId)
        .single();

      if (!artist) {
        throw new Error("Artist not found");
      }

      // Add song to setlist
      const { data: song, error } = await supabase
        .from("setlist_songs")
        .insert({
          show_id: showId,
          artist_id: artistId,
          artist_name: artist.name,
          title: newSong,
          votes: 1,
          suggested_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial vote from user
      await supabase.from("votes").insert({
        user_id: user.user.id,
        setlist_song_id: song.id,
        show_id: showId,
        vote_type: "up",
      });

      setNewSong("");
      toast({
        title: "Song Added",
        description: "Your song suggestion has been added to the setlist.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding song:", error);
      toast({
        title: "Error",
        description: "Failed to add your song suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user) return;

      // Check if user suggested this song
      const { data: song } = await supabase
        .from("setlist_songs")
        .select("suggested_by")
        .eq("id", songId)
        .single();

      if (song?.suggested_by !== user.user.id) {
        toast({
          title: "Permission Denied",
          description: "You can only delete songs you suggested.",
          variant: "destructive",
        });
        return;
      }

      // Delete song
      await supabase.from("setlist_songs").delete().eq("id", songId);

      // Delete associated votes
      await supabase.from("votes").delete().eq("setlist_song_id", songId);

      toast({
        title: "Song Deleted",
        description: "Your song suggestion has been removed from the setlist.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Error",
        description: "Failed to delete your song suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <form onSubmit={handleAddSong} className="flex gap-2">
          <Input
            placeholder="Enter a song title..."
            value={newSong}
            onChange={(e) => setNewSong(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting}>
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        </form>
      )}

      <ScrollArea className="h-[600px] pr-4">
        <AnimatePresence>
          {songs.map((song) => (
            <motion.div
              key={song.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center space-y-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(song.id, "up")}
                        disabled={!isAuthenticated}
                        className={cn(
                          "h-8 w-8 rounded-full",
                          song.userVoted && "text-primary"
                        )}
                      >
                        <ChevronUp className="h-5 w-5" />
                      </Button>

                      <motion.div
                        key={song.votes}
                        initial={{ scale: 1 }}
                        animate={
                          recentVotes[song.id] ? { scale: [1, 1.2, 1] } : {}
                        }
                        className={cn(
                          "font-medium text-lg",
                          recentVotes[song.id] > 0 && "text-green-500",
                          recentVotes[song.id] < 0 && "text-red-500"
                        )}
                      >
                        {song.votes}
                      </motion.div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(song.id, "down")}
                        disabled={!isAuthenticated}
                        className="h-8 w-8 rounded-full"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h4 className="font-medium text-lg truncate">
                          {song.title}
                        </h4>
                      </div>
                      {song.suggestedBy && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Suggested by {song.suggestedBy}
                        </p>
                      )}
                    </div>

                    {isAuthenticated &&
                      song.suggestedBy ===
                        (
                          supabase.auth.getUser() as any
                        )?.data?.user?.email?.split("@")[0] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSong(song.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
