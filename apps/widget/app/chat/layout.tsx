import { auth } from "@repo/auth";
import { cn } from "@repo/ui/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const getSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

async function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col bg-white overflow-hidden relative"
      )}
    >
      {children}
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
