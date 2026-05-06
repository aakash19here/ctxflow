"use client";

import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { GlobeIcon, Loader2, MicIcon, SquareIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./prompt-input";
import { toast } from "sonner";
import { useMicrophone } from "hooks/use-microphone";

interface ChatInputProps {
  status: UseChatHelpers<UIMessage>["status"];
  error: UseChatHelpers<UIMessage>["error"];
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  handleSubmit: (message: PromptInputMessage) => void;
}

const ChatInput = ({
  error,
  status,
  setText,
  text,
  handleSubmit,
}: ChatInputProps) => {
  const { handleMicClick, isListening, isTranscribing } = useMicrophone({
    setText,
  });

  const onError = (err: {
    code: "max_files" | "max_file_size" | "accept";
    message: string;
  }) => {
    toast.error(err.message);
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="mt-4"
      globalDrop
      maxFiles={1}
      onError={onError as any}
    >
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            onClick={handleMicClick}
            variant={isListening ? "default" : "ghost"}
          >
            {isListening && !isTranscribing && <SquareIcon size={16} />}
            {!isListening && !isTranscribing && <MicIcon size={16} />}
            {!isListening && isTranscribing && (
              <Loader2 size={16} className="animate-spin" />
            )}
            <span className="sr-only">Microphone</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!text && !status && isListening && !isTranscribing}
          status={status}
        />
      </PromptInputToolbar>
    </PromptInput>
  );
};

export default ChatInput;
