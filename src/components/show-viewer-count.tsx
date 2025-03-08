"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ShowViewerCountProps {
  showId: string;
  className?: string;
}

export function ShowViewerCount({ showId, className }: ShowViewerCountProps) {
  const [viewerCount, setViewerCount] = useState(1); // Start with 1 (self)
  const supabase = createClient();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id || "anonymous";
    };

    // Set up presence channel
    const setupPresence = async () => {
      const userId = await getCurrentUser();

      const channel = supabase.channel(`show-${showId}-viewers`, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      // Handle presence state changes
      const handlePresenceState = () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      };

      // Subscribe to presence events
      channel
        .on("presence", { event: "sync" }, handlePresenceState)
        .on("presence", { event: "join" }, handlePresenceState)
        .on("presence", { event: "leave" }, handlePresenceState)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Track user presence
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }
        });

      // Clean up on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupPresence();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, [showId, supabase]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        className
      )}
    >
      <Users className="h-4 w-4" />
      <span>
        {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing
      </span>
    </div>
  );
}
