"use client";

import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ChatStatus, DBMessage } from "@/lib/types";
import {
  Landmark,
  Loader2Icon,
  LogOut,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { toast } from "sonner";

function UserMenu({
  disabledReset,
  id,
}: {
  disabledReset: boolean;
  id: string;
}) {
  const { data: session } = authClient.useSession();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleResetChat = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/chat", {
        method: "DELETE",
        body: JSON.stringify({ chatId: id }),
      });
      router.refresh();
    } catch (e) {
      console.log("[RESET_CHAT_ERROR]", e);
      toast.error("Something went wrong");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error("Unable to log out");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.log("[LOGOUT_ERROR]", e);
      toast.error("Unable to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open user menu">
          <UserRound className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {session?.user?.email ?? "User menu"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={disabledReset || isResetting}
            onClick={handleResetChat}
          >
            {isResetting ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            Reset chat
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLoggingOut}
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            {isLoggingOut ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 size-4" />
            )}
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PureChatHeader({
  messages,
  status,
  id,
}: {
  messages: DBMessage[];
  status: ChatStatus;
  id: string;
}) {
  return (
    <header className="shrink-0 flex justify-between items-center gap-2 border-b bg-white py-3 px-2.5">
      <div className="flex items-center gap-1">
        <Landmark />
        CtxFlow
      </div>
      <div className="flex items-center gap-2">
        <UserMenu
          disabledReset={!messages.length || status === "submitted"}
          id={id}
        />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.status === nextProps.status &&
    prevProps.id === nextProps.id
  );
});
