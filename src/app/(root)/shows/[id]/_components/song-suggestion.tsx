"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { env } from "@/env.mjs";
import { cn } from "@/lib/utils";

// Initialize Supabase client
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

interface SongSuggestionProps {
  showId: string;
  artistId: string;
  userId: string;
}

export function SongSuggestion({
  showId,
  artistId,
  userId,
}: SongSuggestionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [songs, setSongs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadArtistTopTracks() {
      try {
        setLoading(true);

        // Get artist's top tracks from database
        const { data, error } = await supabase
          .from("top_tracks")
          .select("id, name")
          .eq("artist_id", artistId)
          .order("popularity", { ascending: false });

        if (error) throw error;

        // Get songs already in the setlist to filter them out
        const { data: existingSongs, error: existingSongsError } =
          await supabase
            .from("setlist_songs")
            .select("track_id")
            .eq("show_id", showId);

        if (existingSongsError) throw existingSongsError;

        // Filter out songs already in the setlist
        const existingSongIds = existingSongs.map((song) => song.track_id);
        const filteredSongs = data.filter(
          (song) => !existingSongIds.includes(song.id)
        );

        setSongs(filteredSongs);
      } catch (error) {
        console.error("Error loading top tracks:", error);
        toast.error("Failed to load songs");
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadArtistTopTracks();
    }
  }, [open, artistId, showId]);

  async function handleSuggestSong() {
    if (!value) {
      toast.error("Please select a song");
      return;
    }

    try {
      // Get the selected song details
      const selectedSong = songs.find((song) => song.id === value);

      if (!selectedSong) {
        toast.error("Invalid song selection");
        return;
      }

      // Get the setlist for this show
      const { data: setlist, error: setlistError } = await supabase
        .from("setlists")
        .select("id")
        .eq("show_id", showId)
        .single();

      if (setlistError) {
        // Create a new setlist if one doesn't exist
        const { data: newSetlist, error: newSetlistError } = await supabase
          .from("setlists")
          .insert({
            show_id: showId,
            name: `Setlist for show ${showId}`,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .select("id")
          .single();

        if (newSetlistError) throw newSetlistError;

        // Add song to the new setlist
        const { error: songError } = await supabase
          .from("setlist_songs")
          .insert({
            show_id: showId,
            artist_id: artistId,
            artist_name: "", // This would be filled with the artist name in a real app
            title: selectedSong.name,
            track_id: selectedSong.id,
            votes: 1,
            suggested_by: userId,
            created_at: new Date(),
          });

        if (songError) throw songError;
      } else {
        // Add song to existing setlist
        const { error: songError } = await supabase
          .from("setlist_songs")
          .insert({
            show_id: showId,
            artist_id: artistId,
            artist_name: "", // This would be filled with the artist name in a real app
            title: selectedSong.name,
            track_id: selectedSong.id,
            votes: 1,
            suggested_by: userId,
            created_at: new Date(),
          });

        if (songError) throw songError;
      }

      // Add a vote for the user
      const { data: newSong, error: newSongError } = await supabase
        .from("setlist_songs")
        .select("id")
        .eq("show_id", showId)
        .eq("track_id", selectedSong.id)
        .single();

      if (newSongError) throw newSongError;

      const { error: voteError } = await supabase.from("votes").insert({
        user_id: userId,
        setlist_song_id: newSong.id,
        show_id: showId,
        vote_type: "up",
        created_at: new Date(),
      });

      if (voteError) throw voteError;

      toast.success(`Added "${selectedSong.name}" to the setlist`);
      setValue("");
      setOpen(false);

      // Refresh the page to show the updated setlist
      router.refresh();
    } catch (error) {
      console.error("Error suggesting song:", error);
      toast.error("Failed to suggest song");
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between w-full sm:w-[300px]"
            >
              {value ?
                songs.find((song) => song.id === value)?.name
              : "Select a song..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full sm:w-[300px]">
            <Command>
              <CommandInput placeholder="Search songs..." />
              <CommandEmpty>
                {loading ? "Loading..." : "No songs found."}
              </CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {songs.map((song) => (
                  <CommandItem
                    key={song.id}
                    value={song.id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === song.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {song.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSuggestSong}
          disabled={!value}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Suggest Song
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Suggest songs you'd like to hear at this show. Your suggestion will
        automatically receive one vote.
      </p>
    </div>
  );
}
