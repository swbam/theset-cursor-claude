"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareButton } from "./share-button";

interface SetlistSong {
  id: string;
  name: string;
  votes: number;
}

interface SetlistShareImageProps {
  showName: string;
  artistName: string;
  venueName: string;
  venueCity: string;
  showDate: Date;
  songs: SetlistSong[];
  showUrl: string;
}

export function SetlistShareImage({
  showName,
  artistName,
  venueName,
  venueCity,
  showDate,
  songs,
  showUrl,
}: SetlistShareImageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const setlistRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!setlistRef.current) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(setlistRef.current, { quality: 0.95 });

      // Create a link and trigger download
      const link = document.createElement("a");
      link.download = `${artistName}-setlist-${format(showDate, "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Setlist image downloaded");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <h3 className="text-xl font-semibold">Share This Setlist</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Image"}
          </Button>
          <ShareButton
            url={showUrl}
            title={`${artistName} at ${venueName} - Setlist`}
            description={`Check out the setlist for ${artistName} at ${venueName} on TheSet!`}
            size="sm"
          />
        </div>
      </div>

      <div
        ref={setlistRef}
        className="bg-background border rounded-lg overflow-hidden max-w-2xl mx-auto"
        style={{ width: "600px", padding: "20px" }}
      >
        <div className="flex flex-col items-center text-center mb-4">
          <h2 className="text-2xl font-bold">{artistName}</h2>
          <p className="text-muted-foreground">
            {venueName}, {venueCity}
          </p>
          <p className="text-sm">{format(showDate, "EEEE, MMMM d, yyyy")}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-center mb-4">Setlist</h3>
          <ol className="list-decimal pl-8 space-y-2">
            {songs.map((song) => (
              <li key={song.id} className="text-base">
                {song.name}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>Generated by TheSet - The Concert Setlist Voting Platform</p>
          <p>
            Visit us at{" "}
            {typeof window !== "undefined" ?
              window.location.origin
            : "theset.app"}
          </p>
        </div>
      </div>
    </div>
  );
}
