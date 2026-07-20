import { Landmark } from "lucide-react";
import OtpAuth from "@/components/auth/otp";
import { auth } from "@repo/auth/src";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white overflow-hidden relative items-center justify-center">
      <header className="shrink-0 flex justify-between items-center gap-2 border-b bg-white py-3 px-2.5 top-0 absolute w-full">
        <div className="flex items-center gap-1">
          <Landmark />
          CtxFlow
        </div>
      </header>
      <div className="max-w-md w-full mx-auto px-5 space-y-5">
        <h1 className="text-xl md:text-3xl text-center font-medium">
          Welcome to <span className="text-primary">CtxFlow</span>
        </h1>
        <OtpAuth />
      </div>
    </div>
  );
}
