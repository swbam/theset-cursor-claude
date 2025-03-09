import Image from "next/image";
import Link from "next/link";

import type { AllSearch } from "@/types";

import { cn, getHref, getImageSrc } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

interface SearchAllProps {
  data: AllSearch;
  isLoading?: boolean;
}

export function SearchAll({ data, isLoading }: SearchAllProps) {
  if (isLoading) {
    return <SearchAllSkeleton />;
  }

  const hasArtists = data.artists.length > 0;
  const hasShows = data.shows.length > 0;
  const hasVenues = data.venues.length > 0;
  const hasData = hasArtists || hasShows || hasVenues;

  if (!hasData) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 py-2">
      {Object.entries(data).map(([key, value]) => {
        if (value.length === 0) return null;

        return (
          <div key={key} className="space-y-2">
            <h3 className="px-2 font-medium capitalize">{key}</h3>
            <div className="space-y-1">
              {value.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={getHref(t.url, t.type)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image
                      src={getImageSrc(t.image)}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden text-sm">
                    <p className="truncate">{t.name}</p>
                    {t.type === "show" && (
                      <p className="text-xs text-muted-foreground">
                        {(t as any).venue} • {(t as any).date}
                      </p>
                    )}
                    {t.type === "venue" && (
                      <p className="text-xs text-muted-foreground">
                        {(t as any).city}
                      </p>
                    )}
                    {t.type === "artist" && (
                      <p className="text-xs text-muted-foreground">Artist</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {value.length > 5 && (
              <div className="px-2 pt-1">
                <Link
                  href={`/search/${key.toLowerCase()}/${encodeURIComponent(
                    "recent"
                  )}`}
                  className="text-xs text-primary hover:underline"
                >
                  View all {value.length} {key}
                </Link>
              </div>
            )}
            {key !== "venues" && <Separator className="mt-3" />}
          </div>
        );
      })}
    </div>
  );
}

function SearchAllSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      {["Artists", "Shows", "Venues"].map((category) => (
        <div key={category} className="space-y-2">
          <h3 className="px-2 font-medium">{category}</h3>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
              >
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
          {category !== "Venues" && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );
}
