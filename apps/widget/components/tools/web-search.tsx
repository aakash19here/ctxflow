import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@repo/ui/components/ai-elements/chain-of-thought";
import { cn } from "@repo/ui/lib/utils";
import { WebSearchTool } from "@/lib/types";
import { GlobeIcon, Loader2 } from "lucide-react";

interface WebSearchUIProps {
  output: WebSearchTool["output"];
}

export function WebSearchUI({ output }: WebSearchUIProps) {
  return (
    <ChainOfThought defaultOpen className="space-y-0 mb-5 my-2">
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        <ChainOfThoughtSearchResults>
          {output.map((website: any) => (
            <ChainOfThoughtSearchResult key={website.url}>
              <a
                href={website.url}
                target="_blank"
                className={cn("flex gap-2")}
              >
                <img
                  alt=""
                  className="size-4 rounded-full"
                  height={16}
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(website.url).hostname}`}
                  width={16}
                />{" "}
                {new URL(website.url).hostname}
              </a>
            </ChainOfThoughtSearchResult>
          ))}
        </ChainOfThoughtSearchResults>
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

export function WebSearchLoading() {
  return (
    <div className="flex gap-2 items-center text-sm">
      <ChainOfThoughtStep icon={GlobeIcon} label="Searching the Web..." />
      <Loader2 className="animate-spin size-4 text-muted-foreground" />
    </div>
  );
}
