import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Dot,
  Music,
  Share2,
  Star,
  Users,
} from "lucide-react";

import type {
  Album,
  Artist,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
  User,
} from "@/types";

import { FavoriteButton } from "@/components/favorite-button";
import { getUser } from "@/lib/auth";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { getUserFavorites, getUserPlaylists } from "@/server/db/client/queries";
import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { MoreButton } from "./more-button";

type DetailsHeaderProps = {
  item: Album | Song | Playlist | Artist | Episode | ShowDetails | Label | Mix;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const songs =
    item.type === "song" ? [item]
    : "songs" in item ? item.songs
    : [];

  const user = await getUser();

  let playlists, favorites;

  if (user) {
    [playlists, favorites] = await Promise.all([
      getUserPlaylists(user.id),
      getUserFavorites(user.id),
    ]);
  }

  return (
    <div className="container flex flex-col pb-8 pt-0 md:gap-6 md:pb-6 md:pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-9">
        <div className="relative h-60 w-60 shrink-0 overflow-hidden rounded-lg md:h-[280px] md:w-[280px]">
          <Image
            src={getImageSrc(item.image, "high")}
            alt={item.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 240px, 280px"
          />
        </div>

        <div className="flex flex-1 flex-col space-y-1.5">
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent md:text-4xl">
            {"explicit" in item && item.explicit && (
              <Badge className="mr-2 rounded px-1 py-0 font-bold">E</Badge>
            )}
            {item.name}

            {"is_verified" in item && item.is_verified && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Check className="h-3.5 w-3.5 text-background" />
              </span>
            )}
          </h1>

          <div className="mt-1 flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">
                {item.type === "show" ? "Concert" : item.type}
              </span>
              {item.fan_count && (
                <>
                  <Dot className="h-3 w-3" />
                  <div className="flex items-center">
                    <Users className="mr-1 h-3.5 w-3.5" />{" "}
                    {item.fan_count.toLocaleString()} Listeners
                  </div>
                </>
              )}
            </div>
          </div>

          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
                by{" "}
                {item.artist_map.artists.map(({ id, name, url }, i, arr) => (
                  <Link
                    key={id}
                    href={getHref(url, "artist")}
                    title={name}
                    className="hover:text-foreground"
                  >
                    {name}
                    {i !== arr.length - 1 && ","}
                  </Link>
                ))}
                {" · "}
                {item.song_count} Songs
                {" · "}
                {item.play_count.toLocaleString()} Plays
                {" · "}
                {item.duration ?
                  formatDuration(item.duration, "mm:ss")
                : "Unknown Duration"}
              </p>

              <div className="text-center lg:hidden">
                <p>
                  by{" "}
                  {item.artist_map?.artists.map(({ id, name, url }, i) => (
                    <Link
                      key={id}
                      href={getHref(url, "artist")}
                      title={name}
                      className="hover:text-foreground"
                    >
                      {name}
                      {i !== item.artist_map?.artists.length - 1 && ","}
                    </Link>
                  ))}
                </p>

                <p className="capitalize">
                  {item.type}
                  {" · "}
                  {item.play_count?.toLocaleString()} Plays
                </p>
              </div>
            </>
          )}

          {item.type === "song" && (
            <p>
              <Link
                href={getHref(item.album_url, "album")}
                className="hover:text-foreground"
              >
                {item.album}
              </Link>
              {" by "}
              {item.artist_map.primary_artists.map(
                ({ id, name, url }, i, arr) => (
                  <Link
                    key={id}
                    href={getHref(url, "artist")}
                    className="hover:text-foreground"
                  >
                    {name}
                    {i !== arr.length - 1 && ", "}
                  </Link>
                )
              )}
            </p>
          )}

          {item.type === "episode" && <p>{item.header_desc}</p>}

          {item.type === "playlist" && (
            <p className="capitalize">
              {item.subtitle}
              {" · "}
              {item.subtitle_desc
                .reverse()
                .map((s, i, arr) => s + (i !== arr.length - 1 ? " · " : ""))}
            </p>
          )}

          {item.type === "show" && (
            <p>
              Podcast{" · "}
              {item.fan_count.toLocaleString()} Fans
            </p>
          )}

          {item.type === "artist" && (
            <p>
              Artist
              {" · "}
              {item.fan_count.toLocaleString()} Listeners
            </p>
          )}

          {item.type === "mix" && (
            <p>
              {item.firstname}
              {" · "}
              {item.lastname}
              {" · "}
              {item.list_count} Songs
            </p>
          )}

          {item.type === "label" && <p>Record Label</p>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <PlayButton
          type={item.type}
          token={
            item.type === "show" ?
              item.id
            : (item.type === "artist" ? item.urls.songs : item.url)
                .split("/")
                .pop()!
          }
          className={cn(
            buttonVariants(),
            "rounded-full px-10 text-xl font-bold shadow-sm"
          )}
        >
          Play
        </PlayButton>

        <LikeButton
          user={user}
          type={item.type}
          token={item.id}
          name={item.name}
          favourites={favorites}
          className={cn(
            buttonVariants({ size: "icon", variant: "outline" }),
            "rounded-full shadow-sm"
          )}
        />

        <DownloadButton
          songs={songs ?? []}
          className={cn(
            buttonVariants({ size: "icon", variant: "outline" }),
            "rounded-full shadow-sm"
          )}
        />

        <MoreButton
          user={user}
          name={item.name}
          subtitle={item.subtitle}
          type={item.type}
          image={item.image}
          songs={songs ?? []}
          playlists={playlists}
        />

        {user && item.id && (
          <FavoriteButton
            isFavorite={favorites?.includes(item.id)}
            favoriteId={item.id}
            user={user}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-9 w-9">
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
