import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";

import type { User } from "@/types";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface FavoriteButtonProps {
  isFavorite?: boolean;
  favoriteId: string;
  user: User;
  className?: string;
}

export function FavoriteButton({
  isFavorite = false,
  favoriteId,
  user,
  className,
}: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const { toast } = useToast();

  const { mutate: toggleFavorite, isPending } = useMutation({
    mutationFn: async () => {
      const action = favorite ? "unfavorite" : "favorite";
      const response = await fetch(`/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          itemId: favoriteId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorite status");
      }

      return { action };
    },
    onSuccess: ({ action }) => {
      setFavorite(!favorite);
      toast({
        title:
          action === "favorite" ? "Added to favorites" : (
            "Removed from favorites"
          ),
        description:
          action === "favorite" ?
            "This item has been added to your favorites"
          : "This item has been removed from your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      size="icon"
      variant={favorite ? "default" : "outline"}
      className={className}
      onClick={() => toggleFavorite()}
      disabled={isPending}
    >
      <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
    </Button>
  );
}
