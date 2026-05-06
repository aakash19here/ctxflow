"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { authClient } from "@repo/auth/src/client";
import { DataStreamProvider } from "./data-stream-provider";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });
  }, []);

  useEffect(() => {
    const user = session.data?.user;
    if (user?.id) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else {
      posthog.reset();
    }
  }, [session.data?.user?.id]);

  return (
    <DataStreamProvider>
      <PHProvider client={posthog}>{children}</PHProvider>
    </DataStreamProvider>
  );
}
