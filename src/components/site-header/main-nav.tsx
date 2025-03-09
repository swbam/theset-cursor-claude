"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { MegaMenu } from "@/types";

import { Icons } from "@/components/icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { siteConfig } from "@/config/site";
import { cn, getHref } from "@/lib/utils";

type MainNavProps = {
  megaMenu?: MegaMenu;
  className?: string;
};

export function MainNav({ className, megaMenu }: MainNavProps) {
  const menuItems = siteConfig.mainNav;

  return (
    <div className="hidden gap-6 lg:flex">
      <Link
        href="/"
        className="hidden items-center space-x-2 lg:flex"
        aria-label={siteConfig.name}
      >
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-heading font-bold lg:inline-block">
          {siteConfig.name}
        </span>
      </Link>

      <NavigationMenu className={className}>
        <NavigationMenuList>
          {menuItems.map((item) => (
            <NavigationMenuItem key={item.title}>
              {item.items ?
                <>
                  <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.items.map((item) => (
                        <ListItem
                          key={item.title}
                          title={item.title}
                          href={item.href}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              : <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              }
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

interface ListItemProps extends React.PropsWithChildren {
  title: string;
  href: string;
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ title, href, children }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            )}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);

ListItem.displayName = "ListItem";
