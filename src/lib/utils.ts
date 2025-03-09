import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the absolute url for the given path based on the current environment
 * @param path The path to get the absolute url for
 * @returns The absolute url for the given path
 */
export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

/**
 * Encodes and decodes strings to and from base64
 * @param str The string to encode/decode
 * @returns The encoded/decoded string
 */
export const base64 = {
  encode: (str: string) => Buffer.from(str, "utf8").toString("base64"),
  decode: (str: string) => Buffer.from(str, "base64").toString("ascii"),
};

/**
 * Shows a toast notification with an error message
 */
export function showErrorToast(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
) {
  console.error(error);

  const errorMessage = error instanceof Error ? error.message : fallbackMessage;

  toast.error(errorMessage, {
    description: "An error occurred. Please try again later.",
    position: "bottom-center",
  });
}

/**
 * Copies the given text to the clipboard
 * @param text The text to copy
 * @returns Promise that resolves when the text is copied
 */
export async function copyToClipboard(
  text: string,
  options?: {
    message?: string;
  }
) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(options?.message || "Copied to clipboard", {
      position: "bottom-center",
    });
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    toast.error("Failed to copy to clipboard", {
      description: "Please try again.",
      position: "bottom-center",
    });
  }
}

/**
 * Throws an error with the given message
 * @param message The Error message
 */
export function rethrow(message: string): never {
  throw new Error(message);
}

/**
 * Formats a duration in seconds to a readable format
 */
export function formatDuration(
  seconds: number,
  format: "hh:mm:ss" | "mm:ss" = "mm:ss"
) {
  if (!seconds || isNaN(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMinutes =
    format === "hh:mm:ss" ?
      minutes.toString().padStart(2, "0")
    : minutes.toString();
  const formattedSeconds = secs.toString().padStart(2, "0");

  if (format === "hh:mm:ss" || hours > 0) {
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Check if the current environment is development
 */
export function currentlyInDev() {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if the current OS is macOS
 */
export function isMacOs() {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.includes("Mac");
}

/**
 * Format a large number to a human-readable string
 * @example 1500 -> 1.5K, 1500000 -> 1.5M
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Format a compact number (e.g., 1.2K, 1.5M)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Convert a string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

/**
 * Get the correct href for a URL based on its type
 */
export function getHref(url: string, type?: string): string {
  if (!url) return "#";

  if (url.startsWith("http")) {
    return url;
  }

  // For internal links, ensure they have the correct format
  if (type) {
    switch (type) {
      case "artist":
        return `/artist/${url.split("/").pop()}`;
      case "album":
        return `/album/${url.split("/").pop()}`;
      case "song":
        return `/song/${url.split("/").pop()}`;
      case "show":
        return `/shows/${url.split("/").pop()}`;
      case "venue":
        return `/venues/${url.split("/").pop()}`;
      default:
        return url;
    }
  }

  return url;
}

/**
 * Get the appropriate image URL with quality
 */
export function getImageSrc(
  url: string | null | undefined,
  quality?: "high" | "medium" | "low"
): string {
  if (!url) return "/images/placeholder.jpg";

  // If it's already a complete URL, return it
  if (url.startsWith("http")) {
    return url;
  }

  // For placeholder images
  if (url.startsWith("/")) {
    return url;
  }

  // For Spotify images, quality might be relevant
  // This is a simplified version
  return url;
}
