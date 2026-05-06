"use client";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import Chat from "@repo/ui/components/ai/chat";
import { Landmark, X } from "lucide-react";
import { useState } from "react";

export function Widget() {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className="fixed bottom-5 right-5">
        <Button
          className="rounded-full size-12"
          size={"icon"}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className="size-8 p-1" />
          ) : (
            <Landmark className="size-8 p-1" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="flex px-0 h-[100dvh] w-full flex-1 overflow-hidden border border-gray-200 bg-white sm:h-[80dvh] sm:rounded-2xl dark:border-gray-700 dark:bg-gray-950 sm:top-auto sm:bottom-20 sm:right-4 sm:left-auto sm:min-w-[400px] sm:max-w-[400px] sm:max-h-[80dvh]"
        align="end"
      >
        <Chat />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
