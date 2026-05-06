"use client";

import {
  ExternalLink,
  FileIcon,
  Loader2Icon,
  LoaderIcon,
  MicIcon,
  PaperclipIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type {
  ChangeEvent,
  ComponentProps,
  Dispatch,
  HTMLAttributes,
  KeyboardEventHandler,
  SetStateAction,
} from "react";
import {
  Children,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { toast } from "sonner";

type UseAutoResizeTextareaProps = {
  minHeight: number;
  maxHeight?: number;
};

const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
};

export type AIInputProps = HTMLAttributes<HTMLFormElement>;

export const AIInput = ({ className, ...props }: AIInputProps) => (
  <form
    className={cn(
      "w-full divide-y overflow-hidden rounded-2xl border bg-background shadow-sm",
      className
    )}
    {...props}
  />
);

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export type AIInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  status: UseChatHelpers<UIMessage>["status"];
  error: UseChatHelpers<UIMessage>["error"];
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
};

export const AIInputTextarea = ({
  onChange,
  className,
  placeholder = "What would you like to know?",
  minHeight = 80,
  maxHeight = 164,
  status,
  error,
  text,
  attachments,
  setAttachments,
  setText,
  ...props
}: AIInputTextareaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  // Speech to text state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const data = await response.json();

      toast.error(data.error);
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  const startRecording = async () => {
    try {
      if (isListening || isTranscribing) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredType = "audio/webm;codecs=opus";
      const fallbackType = "audio/webm";
      const isSupported = (window as any).MediaRecorder?.isTypeSupported?.(
        preferredType
      )
        ? preferredType
        : (window as any).MediaRecorder?.isTypeSupported?.(fallbackType)
          ? fallbackType
          : undefined;

      const recorder = isSupported
        ? new MediaRecorder(stream, { mimeType: isSupported })
        : new MediaRecorder(stream);

      mediaChunksRef.current = [];

      recorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {};

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to access microphone");
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;
      const stream = mediaStreamRef.current;
      recorder.stop();
      stream?.getTracks().forEach((t) => t.stop());
      setIsListening(false);

      await new Promise((res) => setTimeout(res, 50));

      const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
      mediaChunksRef.current = [];

      setIsTranscribing(true);

      const form = new FormData();
      const file = new File([blob], "audio.webm", { type: "audio/webm" });
      form.append("file", file);
      form.append("language", "en");

      const resp = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Transcription failed");
      }
      const data = await resp.json();
      setText((prevText) => prevText + data.text || "");
    } catch (e: any) {
      toast.error(e?.message || "Upload/transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (isTranscribing) return;
    if (!isListening) {
      startRecording();
    } else {
      stopRecordingAndTranscribe();
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 items-end p-2"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}
      <Textarea
        className={cn(
          "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
          "bg-transparent dark:bg-transparent",
          "focus-visible:ring-0",
          className
        )}
        name="message"
        onChange={(e) => {
          adjustHeight();
          onChange?.(e);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        {...props}
      />

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        <Button
          data-testid="mic-button"
          className={cn(
            "ml-1 rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200",
            isListening && "bg-red-100 text-red-700 hover:bg-red-100",
            isTranscribing && "opacity-50 cursor-not-allowed"
          )}
          onClick={(event) => {
            event.preventDefault();
            handleMicClick();
          }}
          aria-pressed={isListening}
          aria-label={isListening ? "Stop recording" : "Start recording"}
          disabled={status !== "ready" || isTranscribing}
          variant="ghost"
        >
          {isListening ? <SquareIcon size={14} /> : <MicIcon size={14} />}
        </Button>
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        <AIInputSubmit
          disabled={!text || error != null || isListening || isTranscribing}
          status={status}
          variant={"ghost"}
        />
      </div>
      {(isListening || isTranscribing) && (
        <div className="absolute -top-5 left-2 mb-1 text-xs text-muted-foreground flex items-center gap-2">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              isListening ? "bg-red-500 animate-pulse" : "bg-amber-500"
            )}
          />
          {isListening ? "Recording… click to stop" : "Transcribing…"}
        </div>
      )}
    </div>
  );
};

const AttachmentsButton = memo(PureAttachmentsButton);

export type MessageMetadata = {
  createdAt: string;
};

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  status: UseChatHelpers<UIMessage>["status"];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== "ready"}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

export type AIInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const AIInputToolbar = ({
  className,
  ...props
}: AIInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between p-1", className)}
    {...props}
  />
);

export type AIInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const AIInputTools = ({ className, ...props }: AIInputToolsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className
    )}
    {...props}
  />
);

export type AIInputButtonProps = ComponentProps<typeof Button>;

export const AIInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: AIInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? "default" : "icon";

  return (
    <Button
      className={cn(
        "shrink-0 gap-1.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground",
        newSize === "default" && "px-3",
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type AIInputSubmitProps = ComponentProps<typeof Button> & {
  status?: "submitted" | "streaming" | "ready" | "error";
};

export const AIInputSubmit = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: AIInputSubmitProps) => {
  let Icon = <SendIcon />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon />;
  } else if (status === "error") {
    Icon = <XIcon />;
  }

  return (
    <Button
      className={cn(
        "gap-1.5 rounded-lg bg-transparent text-primary rounded-br-xl",
        className
      )}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type AIInputModelSelectProps = ComponentProps<typeof Select>;

export const AIInputModelSelect = (props: AIInputModelSelectProps) => (
  <Select {...props} />
);

export type AIInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const AIInputModelSelectTrigger = ({
  className,
  ...props
}: AIInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type AIInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const AIInputModelSelectContent = ({
  className,
  ...props
}: AIInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type AIInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const AIInputModelSelectItem = ({
  className,
  ...props
}: AIInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type AIInputModelSelectValueProps = ComponentProps<typeof SelectValue>;

export const AIInputModelSelectValue = ({
  className,
  ...props
}: AIInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  showTitle = true,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  showTitle?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div
        className={cn(
          "bg-muted rounded-md relative flex flex-col items-center justify-center",
          {
            "my-2": !showTitle,
            "w-20 h-16 aspect-video": contentType !== "application/pdf",
          }
        )}
      >
        {contentType ? (
          contentType.startsWith("image") ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? "An image attachment"}
              className="rounded-md size-full object-cover"
            />
          ) : contentType === "application/pdf" ? (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({
                  size: "icon",
                  className: "border relative",
                })
              )}
            >
              <ExternalLink className="absolute -right-2 -top-1 size-3 " />
              <FileIcon size={8} />
            </a>
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      {showTitle && (
        <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
      )}
    </div>
  );
};
