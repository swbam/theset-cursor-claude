import {
  Home,
  Mic2,
  Music,
  Search,
  Star,
  TicketIcon,
  TrendingUp,
} from "lucide-react";

export const siteConfig = {
  name: "TheSet",
  description:
    "Discover upcoming concerts, vote on setlists, and influence live performances with TheSet.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://theset.app",
  ogImage: "/og.png",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Artists",
      href: "/artist",
    },
    {
      title: "Shows",
      href: "/shows",
    },
    {
      title: "Search",
      href: "/search",
    },
  ],
  sidebarNav: [
    {
      title: "Discover",
      items: [
        {
          title: "Trending Shows",
          href: "/",
          icon: TrendingUp,
        },
        {
          title: "All Shows",
          href: "/shows",
          icon: TicketIcon,
        },
        {
          title: "Artists",
          href: "/artist",
          icon: Mic2,
        },
      ],
    },
    {
      title: "My Music",
      items: [
        {
          title: "My Spotify Artists",
          href: "/my/artists",
          icon: Music,
        },
        {
          title: "My Setlists",
          href: "/my/setlists",
          icon: Star,
        },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
