import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@repo/ui/globals.css";
import { Databuddy } from "@databuddy/sdk/react";
import { Toaster } from "@repo/ui/components/sonner";
import { PostHogProvider } from "components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CtxFlow",
  description: "An agentic AI assistant for your knowledge base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLocalhost = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <head>
        {isLocalhost && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
        <Toaster position="top-center" />
        <Databuddy
          clientId="NhvqgmzbfD0JDRhdV81kA"
          trackHashChanges={true}
          trackInteractions={true}
          trackEngagement={true}
          trackBounceRate={true}
          trackErrors={true}
          enableBatching={true}
        />
      </body>
    </html>
  );
}
