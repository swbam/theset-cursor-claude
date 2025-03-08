"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { ListMusic, Music } from "lucide-react";

import type { User } from "next-auth";

import { buttonVariants } from "@/components/ui/button";
import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

type SidebarProps = {
  user?: User;
};

export function Sidebar({ user }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  return (
    <aside className="fixed left-0 top-14 hidden h-full w-1/5 space-y-2 border-r p-4 animate-in slide-in-from-left-full [animation-duration:500ms] lg:block xl:w-[15%]">
      <h3 className="pl-3 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        Discover
      </h3>

      <nav>
        <ul className="space-y-0.5">
          {sidebarNav.slice(0, 5).map(({ title, href, icon: Icon }) => {
            const isActive = href === "/" + (segment ?? "");

            return (
              <li key={title}>
                <NavLink title={title} href={href} isActive={isActive}>
                  <Icon className="mr-2 size-5" />
                  {title}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!!user && (
        <>
          <h3 className="pl-3 font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            My Music
          </h3>

          <nav>
            <ul className="space-y-0.5">
              {sidebarNav.slice(5).map(({ title, href, icon: Icon }) => {
                const isActive = href === "/" + (segment ?? "");

                return (
                  <li key={title}>
                    <NavLink title={title} href={href} isActive={isActive}>
                      <Icon className="mr-2 size-5 shrink-0" />
                      {title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}

      <div className="flex items-center justify-between pl-3">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Featured Artists
        </h3>
      </div>

      <ScrollArea>
        <ul className="flex max-h-[380px] flex-col">
          {/* This would be populated with featured artists */}
          <li>
            <NavLink href="/artist/1" isActive={false} className="group">
              <Music className="mr-2 size-5" />
              Taylor Swift
            </NavLink>
          </li>
          <li>
            <NavLink href="/artist/2" isActive={false} className="group">
              <Music className="mr-2 size-5" />
              The Weeknd
            </NavLink>
          </li>
          <li>
            <NavLink href="/artist/3" isActive={false} className="group">
              <Music className="mr-2 size-5" />
              Billie Eilish
            </NavLink>
          </li>
          <li>
            <NavLink href="/artist/4" isActive={false} className="group">
              <Music className="mr-2 size-5" />
              Drake
            </NavLink>
          </li>
          <li>
            <NavLink href="/artist/5" isActive={false} className="group">
              <Music className="mr-2 size-5" />
              Dua Lipa
            </NavLink>
          </li>
        </ul>

        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </aside>
  );
}

const NavLink = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    isActive: boolean;
  }
>(({ href, isActive, className, children, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      href={href!}
      className={cn(
        buttonVariants({ size: "sm", variant: "ghost" }),
        "flex justify-start text-muted-foreground",
        isActive && "bg-secondary font-bold text-secondary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";
