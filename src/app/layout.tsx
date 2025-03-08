import "@/styles/globals.css";

import React from "react";
import { Poppins as FontHeading, Inter as FontSans } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";

import type { Metadata, Viewport } from "next";
import type { ThemeConfig } from "@/types";

import { Analytics } from "@/components/analytics";
import Providers from "@/components/provider";
import { SwipeGestureProvider } from "@/components/swipe-gesture-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import * as fonts from "@/lib/fonts";
import { absoluteUrl, cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontHeading = FontHeading({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "concert",
    "setlist",
    "voting",
    "music",
    "live music",
    "shows",
    "artists",
    "spotify",
  ],
  authors: [
    {
      name: "TheSet Team",
      url: "https://theset.app",
    },
  ],
  creator: "TheSet Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.png`],
    creator: "@thesetapp",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

type RootLayoutProps = {
  modal: React.ReactNode;
  children: React.ReactNode;
};

export default async function RootLayout({ modal, children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const themeConfig = cookieStore.get("theme-config");

  const { theme, radius } = JSON.parse(
    themeConfig?.value ?? '{"theme":"default","radius":"default"}'
  ) as ThemeConfig;

  return (
    <React.StrictMode>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
            fontHeading.variable,
            `theme-${theme}`
          )}
          style={
            radius === "default" ?
              {}
            : ({ "--radius": `${radius}rem` } as React.CSSProperties)
          }
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SwipeGestureProvider>
              <Providers>
                {children}
                {modal}
              </Providers>
            </SwipeGestureProvider>
            <Toaster />
            <Analytics />
          </ThemeProvider>

          <TailwindIndicator />
        </body>

        {/* Umami Analytics */}
        <Script
          async
          src="https://us.umami.is/script.js"
          data-website-id={env.UMAMI_WEBSITE_ID}
        />
      </html>
    </React.StrictMode>
  );
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};
