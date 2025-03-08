"use client";

import { useState } from "react";
import { Copy, Facebook, Linkedin, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({
  url,
  title,
  description = "Check out this setlist on TheSet!",
  className,
  variant = "outline",
  size = "default",
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure we have the full URL
  const fullUrl =
    url.startsWith("http") ? url : `${window.location.origin}${url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
      console.error("Failed to copy link:", error);
    }
  };

  const handleShare = async (platform: string) => {
    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(description)}&url=${encodeURIComponent(fullUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
        break;
      default:
        // Use Web Share API if available
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: description,
              url: fullUrl,
            });
            return;
          } catch (error) {
            console.error("Error sharing:", error);
          }
        }
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          <Share2 className="h-4 w-4" />
          {size !== "icon" && "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Share Setlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleShare("twitter")}
          className="cursor-pointer"
        >
          <Twitter className="mr-2 h-4 w-4" />
          <span>Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("facebook")}
          className="cursor-pointer"
        >
          <Facebook className="mr-2 h-4 w-4" />
          <span>Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("linkedin")}
          className="cursor-pointer"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
