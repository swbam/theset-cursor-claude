"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

interface VoteNotificationsProps {
  showId: string;
  userId: string;
}

export function VoteNotifications({ showId, userId }: VoteNotificationsProps) {
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to votes on this show
    const channel = supabase
      .channel(`votes-${showId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `show_id=eq.${showId}`,
        },
        async (payload) => {
          // Don't notify for the user's own votes
          if (payload.new.user_id === userId) return;

          // Get song details
          const { data: song } = await supabase
            .from("setlist_songs")
            .select("title")
            .eq("id", payload.new.setlist_song_id)
            .single();

          if (song) {
            // Get user details (if available)
            const { data: user } = await supabase
              .from("users")
              .select("email")
              .eq("id", payload.new.user_id)
              .single();

            const voterName = user?.email?.split("@")[0] || "Someone";

            // Show notification
            toast(
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span>
                  <strong>{voterName}</strong> voted for{" "}
                  <strong>{song.title}</strong>
                </span>
              </div>,
              {
                duration: 4000,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, userId, supabase]);

  // This component doesn't render anything
  return null;
}
