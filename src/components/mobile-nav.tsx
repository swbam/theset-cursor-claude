"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListMusic,
  LogOut,
  Mic,
  Music,
  Search,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const supabase = createClient();

  React.useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
        <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
          <Link
            href="/"
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50"
          >
            <Home
              className={cn(
                "w-6 h-6",
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Home
            </span>
          </Link>

          <Link
            href="/artist"
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50"
          >
            <Mic
              className={cn(
                "w-6 h-6",
                pathname.startsWith("/artist") ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                pathname.startsWith("/artist") ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            >
              Artists
            </span>
          </Link>

          <Link
            href="/shows"
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50"
          >
            <ListMusic
              className={cn(
                "w-6 h-6",
                pathname.startsWith("/shows") ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                pathname.startsWith("/shows") ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            >
              Shows
            </span>
          </Link>

          <Link
            href="/search"
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50"
          >
            <Search
              className={cn(
                "w-6 h-6",
                pathname === "/search" ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                pathname === "/search" ? "text-primary" : (
                  "text-muted-foreground"
                )
              )}
            >
              Search
            </span>
          </Link>

          {user ?
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50">
                  <User
                    className={cn(
                      "w-6 h-6",
                      pathname.startsWith("/my/") ? "text-primary" : (
                        "text-muted-foreground"
                      )
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs mt-1",
                      pathname.startsWith("/my/") ? "text-primary" : (
                        "text-muted-foreground"
                      )
                    )}
                  >
                    Profile
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my/artists">
                    <Music className="mr-2 h-4 w-4" />
                    <span>My Spotify Artists</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my/setlists">
                    <ListMusic className="mr-2 h-4 w-4" />
                    <span>My Setlists</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          : <Link
              href="/login"
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50"
            >
              <User className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs mt-1 text-muted-foreground">
                Sign In
              </span>
            </Link>
          }
        </div>
      </div>

      {/* Side Sheet for Mobile (when needed) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <svg
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
            >
              <path
                d="M3 5H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M3 12H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M3 19H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <MobileLink
            href="/"
            className="flex items-center"
            onOpenChange={setOpen}
          >
            <span className="font-bold">{siteConfig.name}</span>
          </MobileLink>
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-3">
              {siteConfig.mainNav?.map(
                (item) =>
                  item.href && (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      onOpenChange={setOpen}
                    >
                      {item.title}
                    </MobileLink>
                  )
              )}
            </div>
            <div className="flex flex-col space-y-2">
              {siteConfig.sidebarNav.map((item, index) => (
                <div key={index} className="flex flex-col space-y-3 pt-6">
                  <h4 className="font-medium">{item.title}</h4>
                  {item?.items?.length &&
                    item.items.map((item) => (
                      <React.Fragment key={item.href}>
                        {!item.disabled &&
                          (item.href ?
                            <MobileLink
                              href={item.href}
                              onOpenChange={setOpen}
                              className="text-muted-foreground"
                            >
                              {item.title}
                            </MobileLink>
                          : item.title)}
                      </React.Fragment>
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface MobileLinkProps extends React.PropsWithChildren {
  href: string;
  disabled?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

function MobileLink({
  href,
  disabled,
  children,
  className,
  onOpenChange,
}: MobileLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (disabled) {
    return <span className="text-muted-foreground">{children}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "text-foreground transition-colors hover:text-foreground",
        isActive && "text-foreground",
        !isActive && "text-muted-foreground",
        className
      )}
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </Link>
  );
}
