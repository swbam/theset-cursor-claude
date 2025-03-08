import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth-helpers";
import { PersonalizedRecommendations } from "./_components/personalized-recommendations";
import { ShowFilters } from "./_components/show-filters";
import { TrendingShows } from "./_components/trending-shows";
import { UpcomingShows } from "./_components/upcoming-shows";

export const metadata = {
  title: "Home",
  description:
    "Discover upcoming concerts, vote on setlists, and influence live performances.",
};

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="container py-6 space-y-8">
      <section className="bg-muted rounded-lg p-6 md:p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to TheSet
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Discover upcoming concerts, vote on setlists, and influence live
            performances.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/search">Find Artists</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/shows">Browse Shows</Link>
            </Button>
          </div>
        </div>
      </section>

      <ShowFilters />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Trending Shows</h2>
            <p className="text-muted-foreground">
              Popular concerts with active setlist voting
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/shows" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<ShowsGridSkeleton count={3} />}>
          <TrendingShows />
        </Suspense>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Upcoming Shows</h2>
            <p className="text-muted-foreground">
              Concerts happening soon near you
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/shows" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<ShowsGridSkeleton count={3} />}>
          <UpcomingShows />
        </Suspense>
      </section>

      {user && (
        <>
          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">For You</h2>
                <p className="text-muted-foreground">
                  Personalized recommendations based on your Spotify artists
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/my/artists" className="flex items-center gap-1">
                  My Artists <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Suspense fallback={<ShowsGridSkeleton count={3} />}>
              <PersonalizedRecommendations userId={user.id} />
            </Suspense>
          </section>
        </>
      )}

      {!user && (
        <>
          <Separator />

          <section className="py-8 text-center space-y-4 bg-muted rounded-lg p-6">
            <h2 className="text-2xl font-bold">
              Get Personalized Recommendations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sign in with Spotify to see concerts from your favorite artists
              and get personalized recommendations.
            </p>
            <Button asChild className="mt-4" size="lg">
              <Link href="/login">Sign in with Spotify</Link>
            </Button>
          </section>
        </>
      )}
    </div>
  );
}

function ShowsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/2] rounded-lg" />
      ))}
    </div>
  );
}
