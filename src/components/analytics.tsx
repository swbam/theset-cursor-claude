"use client";

import Script from "next/script";

import { env } from "@/lib/env";

export function Analytics() {
  // If you want to add analytics, you can do so here
  // This is just a placeholder component
  const websiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!websiteId) {
    return null;
  }

  return (
    <Script
      async
      src="https://analytics.umami.is/script.js"
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
