import {
  Home,
  LibraryBig,
  Mic2,
  Music,
  Search,
  Settings,
  Star,
  ThumbsUp,
  Ticket as TicketIcon,
} from "lucide-react";

export const siteConfig = {
  name: "TheSet",
  description:
    "A modern concert discovery and setlist voting platform. Find shows, vote on setlists, and connect with your Spotify library.",
  url: "https://theset.vercel.app",
  ogImage: "https://theset.vercel.app/og.jpg",
  links: {
    github: "https://github.com/swbam/theset-cursor-claude",
    twitter: "https://twitter.com/theset",
    x: "https://x.com/theset",
    discord: "https://discord.gg/theset",
  },
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Shows",
      href: "/shows",
    },
    {
      title: "Artists",
      href: "/artist",
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
          title: "Home",
          href: "/",
          icon: Home,
        },
        {
          title: "Search",
          href: "/search",
          icon: Search,
        },
        {
          title: "Shows",
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
      title: "Account",
      items: [
        {
          title: "My Spotify Artists",
          href: "/my/artists",
          icon: LibraryBig,
        },
        {
          title: "My Setlists",
          href: "/my/setlists",
          icon: Star,
        },
        {
          title: "My Votes",
          href: "/my/votes",
          icon: ThumbsUp,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
