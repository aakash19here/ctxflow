import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";
import { UIMessage, UseChatHelpers } from "@ai-sdk/react";

interface UseMicrophoneProps {
  // status: UseChatHelpers<UIMessage>[""];
  setText: Dispatch<SetStateAction<string>>;
}

export const useMicrophone = ({ setText }: UseMicrophoneProps) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);

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

  return {
    isListening,
    isTranscribing,
    handleMicClick,
  };
};
