import { ChainOfThoughtStep } from "@repo/ui/components/ai-elements/chain-of-thought";
import { Database, Loader2 } from "lucide-react";

export function RagSearchLoading() {
  return (
    <div className="flex gap-2 items-center text-sm ">
      <ChainOfThoughtStep icon={Database} label="Searching the database..." />
      <Loader2 className="animate-spin size-4 text-muted-foreground" />
    </div>
  );
}
