"use client";

import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@repo/ui/components/ai/codeblock";
import { toast } from "sonner";

const WIDGET_URL = process.env.NEXT_PUBLIC_WIDGET_URL;

const code = {
  language: "html",
  filename: "index.html",
  code: `<script type="module" src="${WIDGET_URL}/widget.js" async></script>`,
};

export default function WidgetPage() {
  return (
    <div className="flex flex-col h-full py-5 gap-2">
      <Snippet />
      <div className="flex grow shrink-0 mx-auto my-auto px-0 h-[100dvh] w-full flex-1 overflow-hidden border border-gray-200 bg-white sm:h-[80dvh] sm:rounded-2xl dark:border-gray-700 dark:bg-gray-950 sm:top-auto sm:bottom-20 sm:right-4 sm:left-auto sm:min-w-[400px] sm:max-w-[400px] sm:max-h-[80dvh]">
        <iframe src={process.env.NEXT_PUBLIC_CHAT_URL} className="w-full" />
      </div>
    </div>
  );
}

const Snippet = () => {
  return (
    <div className="px-5">
      <CodeBlock
        code={code.code}
        language={code.language}
        showLineNumbers
        filename={code.filename}
      >
        <CodeBlockCopyButton
          onCopy={() => toast.success("Copied code to clipboard")}
          onError={() => toast.error("Failed to copy code to clipboard")}
        />
      </CodeBlock>
    </div>
  );
};
