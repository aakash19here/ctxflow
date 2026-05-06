import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { FileIcon } from "lucide-react";

import { useState } from "react";
import { toast } from "sonner";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { serializeFile } from "@/lib/files";

export default function DocumentInput() {
  const [files, setFiles] = useState<File[] | undefined>();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    trpc.source.createDocument.mutationOptions({
      onSuccess: () => {
        setFiles([]);
        toast.success("Document uploaded successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.source.list.queryKey(),
        });
      },
      onError: (error) => {
        setFiles([]);
        toast.error(error.message);
      },
    })
  );

  const handleDrop = (files: File[]) => {
    setFiles(files);
  };

  const handleSubmit = async () => {
    if (!files?.length && !files) {
      toast.warning("Please select a file");
      return;
    }

    const serializedFile = await serializeFile(files[0]);

    await mutateAsync(serializedFile);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-card group"
          size={"lg"}
        >
          Document
          <FileIcon className="group-hover:scale-110 group-hover:text-primary transform ease-in-out duration-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Please upload a document</DialogTitle>
        <DialogDescription className="hidden" />
        <Dropzone
          disabled={isPending}
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
          }}
          maxFiles={1}
          maxSize={1024 * 1024 * 10}
          minSize={1024}
          onDrop={handleDrop}
          onError={(error) => {
            toast.error(error.message);
          }}
          src={files}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
