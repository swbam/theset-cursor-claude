import { useEffect, useState } from "react";
import { ThumbsUp, Trophy, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface SetlistStatsProps {
  showId: string;
}

interface Stats {
  totalVotes: number;
  uniqueVoters: number;
  topContributors: Array<{
    email: string;
    votes: number;
  }>;
}

export function SetlistStats({ showId }: SetlistStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalVotes: 0,
    uniqueVoters: 0,
    topContributors: [],
  });
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total votes
        const { data: totalVotes } = await supabase
          .from("setlist_songs")
          .select("votes")
          .eq("show_id", showId);

        const voteCount =
          totalVotes?.reduce((sum, song) => sum + (song.votes || 0), 0) || 0;

        // Get unique voters
        const { count: uniqueVoters } = await supabase
          .from("votes")
          .select("user_id", { count: "exact", head: true })
          .eq("show_id", showId);

        // Get top contributors
        const { data: contributors } = await supabase
          .from("votes")
          .select(
            `
            user_id,
            users (
              email
            )
          `
          )
          .eq("show_id", showId);

        const contributorCounts = contributors?.reduce(
          (acc, vote) => {
            const email = vote.users?.email;
            if (email) {
              acc[email] = (acc[email] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        );

        const topContributors = Object.entries(contributorCounts || {})
          .map(([email, votes]) => ({
            email: email.split("@")[0], // Only show username part
            votes,
          }))
          .sort((a, b) => b.votes - a.votes)
          .slice(0, 3);

        setStats({
          totalVotes: voteCount,
          uniqueVoters: uniqueVoters || 0,
          topContributors,
        });
      } catch (error) {
        console.error("Error fetching setlist stats:", error);
      }
    }

    fetchStats();

    // Subscribe to vote changes
    const channel = supabase
      .channel(`setlist-stats-${showId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `show_id=eq.${showId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, supabase]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Total Votes</h3>
            </div>
            <span className="text-2xl font-bold">{stats.totalVotes}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Unique Voters</h3>
            </div>
            <span className="text-2xl font-bold">{stats.uniqueVoters}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Top Contributors</h3>
            </div>
            <div className="space-y-2">
              {stats.topContributors.map((contributor, index) => (
                <div
                  key={contributor.email}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {index + 1}. {contributor.email}
                  </span>
                  <span className="text-sm font-medium">
                    {contributor.votes} votes
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
