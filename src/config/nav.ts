import {
  CalendarDays,
  History,
  ListMusic,
  Mic2,
  Music,
  Star,
  TicketIcon,
  TrendingUp,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const sidebarNav: NavItem[] = [
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
    title: "My Setlists",
    href: "/my/setlists",
    icon: ListMusic,
  },
  {
    title: "Artists",
    href: "/artist",
    icon: Mic2,
  },
  {
    title: "Upcoming Shows",
    href: "/shows",
    icon: CalendarDays,
  },

  // authenticated routes
  {
    title: "My Spotify Artists",
    href: "/my/artists",
    icon: Music,
  },
  {
    title: "My Votes",
    href: "/my/setlists",
    icon: Star,
  },
];
