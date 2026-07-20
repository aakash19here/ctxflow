import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { trpc } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Earth } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

export default function WebsiteInput() {
  const { mutateAsync } = useMutation(
    trpc.source.createWebsite.mutationOptions()
  );
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      url: "",
    },
    validators: {
      onSubmit: z.object({
        url: z.url().startsWith("https://"),
      }),
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        url: value.url,
        type: "website",
        name: value.url,
      });
      toast.success("Source added");
      queryClient.invalidateQueries({
        queryKey: trpc.source.list.queryKey(),
      });
      form.reset();
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-card group"
          size={"lg"}
        >
          Website
          <Earth className="group-hover:-rotate-[30deg] group-hover:scale-110 group-hover:text-primary transform ease-in-out duration-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Enter a website URL</DialogTitle>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-3"
        >
          <form.Field name="url">
            {(field) => (
              <div className="grid gap-3">
                <Label htmlFor={field.name}>Website URL</Label>
                <Input
                  id={field.name}
                  type="url"
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  name={field.name}
                  placeholder="https://docs.example.com"
                  className="focus:bg-transparent"
                  required
                />{" "}
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
          <DialogFooter>
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
