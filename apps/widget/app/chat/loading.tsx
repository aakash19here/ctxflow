import { Skeleton } from "@repo/ui/components/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full flex-col bg-white overflow-hidden relative">
      {/* Header Skeleton */}
      <header className="shrink-0 flex justify-between items-center gap-2 border-b bg-white py-3 px-2.5">
        <div className="flex items-center gap-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </header>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* User message */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-2 max-w-[80%]">
            <Skeleton className="h-10 w-48 rounded-2xl rounded-tr-sm" />
          </div>
        </div>

        {/* AI message */}
        <div className="flex justify-start">
          <div className="flex flex-col items-start gap-2 max-w-[80%]">
            <Skeleton className="h-24 w-full min-w-[300px] rounded-2xl rounded-tl-sm" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-2 max-w-[80%]">
            <Skeleton className="h-10 w-32 rounded-2xl rounded-tr-sm" />
          </div>
        </div>

        {/* AI message */}
        <div className="flex justify-start">
          <div className="flex flex-col items-start gap-2 max-w-[80%]">
            <Skeleton className="h-16 w-full min-w-[250px] rounded-2xl rounded-tl-sm" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="p-3 border-t bg-white">
        <div className="w-full rounded-xl border bg-background shadow-sm p-3 h-[120px] flex flex-col justify-between">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
