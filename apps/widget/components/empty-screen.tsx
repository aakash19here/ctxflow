import { Landmark } from "lucide-react";
import { memo } from "react";

function PureEmptyScreen() {
  return (
    <div className="flex flex-col gap-2 pt-20">
      <div className="flex flex-col items-center">
        <Landmark className="size-6 text-primary" />
        <h1 className="text-xl">CtxFlow</h1>
      </div>
      <p className="text-muted-foreground text-center text-base">
        Welcome to CtxFlow. I&apos;m here to help with your knowledge base.
        What&apos;s your name?
      </p>
    </div>
  );
}

export const EmptyScreen = memo(PureEmptyScreen);
