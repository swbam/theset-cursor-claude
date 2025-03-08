"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  MoreVertical,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

import type { User } from "next-auth";

import { cn } from "@/lib/utils";
import { ShareButton } from "../share-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type TileMoreButtonProps = {
  user?: User;
  item: {
    id: string;
    name: string;
    type: string;
    url: string;
  };
  showId?: string;
  className?: string;
};

export function TileMoreButton(props: TileMoreButtonProps) {
  const { user, item, showId, className } = props;

  const router = useRouter();

  function copyLink() {
    const url = `${window.location.origin}/shows/${showId || item.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  function voteForSong() {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    if (!showId) {
      toast.error("Show ID is required to vote");
      return;
    }

    // Redirect to the show page
    router.push(`/shows/${showId}`);
  }

  function openExternalLink() {
    if (item.type === "artist" && item.url) {
      window.open(item.url, "_blank");
    } else if (showId) {
      window.open(`${window.location.origin}/shows/${showId}`, "_blank");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            className
          )}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {showId && (
          <DropdownMenuItem onClick={voteForSong}>
            <ThumbsUp className="mr-2 h-4 w-4" />
            Vote for song
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={copyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuItem onClick={openExternalLink}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in new tab
        </DropdownMenuItem>

        {showId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/shows/${showId}`}>
                <Share2 className="mr-2 h-4 w-4" />
                Share setlist
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
