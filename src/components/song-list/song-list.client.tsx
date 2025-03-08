import Image from "next/image";
import Link from "next/link";
import { Music } from "lucide-react";

import type { User } from "next-auth";

import { cn, formatDuration, getImageSrc } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { TileMoreButton } from "./more-button";

type Song = {
  id: string;
  name: string;
  artist_name?: string;
  votes?: number;
  duration?: number;
  image?: string;
  type: string;
  url: string;
};

type SongListClientProps = {
  user?: User;
  items: Song[];
  showId?: string;
  className?: string;
};

export function SongListClient(props: SongListClientProps) {
  const { user, items, showId, className } = props;

  return (
    <section className={className}>
      <ol className="space-y-2 text-muted-foreground">
        {items.map((item, i) => (
          <li key={item.id}>
            <div className="group flex h-14 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-sm">
              <div className="hidden w-[6%] lg:flex lg:justify-center xl:w-[4%]">
                <span className="truncate font-medium">{i + 1}</span>
              </div>

              <figure className="flex items-center justify-between gap-4 overflow-hidden lg:w-[86%]">
                <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                  <Image
                    src={getImageSrc(item.image, "low")}
                    alt={item.name}
                    fill
                    className="z-10 object-cover"
                  />

                  <Skeleton className="absolute inset-0 rounded" />
                </div>

                <figcaption className="flex min-w-0 flex-1 flex-col justify-center">
                  <Link
                    href={`/shows/${showId || ""}`}
                    className="truncate font-medium text-foreground hover:underline"
                  >
                    {item.name}
                  </Link>

                  <div className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    <span className="truncate">
                      {item.artist_name || "Unknown Artist"}
                    </span>
                  </div>
                </figcaption>

                <div className="flex items-center gap-2">
                  {item.votes !== undefined && (
                    <span className="text-sm font-medium">
                      {item.votes} votes
                    </span>
                  )}

                  {item.duration && (
                    <span className="text-xs">
                      {formatDuration(item.duration)}
                    </span>
                  )}

                  <TileMoreButton user={user} item={item} showId={showId} />
                </div>
              </figure>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
