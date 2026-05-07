"use client";

import React, { useId } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGenerationJobAction } from "@/app/actions/image-action";
import { cn } from "@/lib/utils";

interface DeleteGenerationJobProps {
  jobId: string;
  onDeleted?: () => void;
  className?: string;
  /** 与图标一起展示，例如「删除图片」 */
  label?: string;
}

const DeleteGenerationJob = ({
  jobId,
  onDeleted,
  className,
  label,
}: DeleteGenerationJobProps) => {
  const toastId = useId();
  const handleDelete = async () => {
    toast.loading("Deleting…", { id: toastId });
    const { error, success } = await deleteGenerationJobAction(jobId);
    if (error) {
      toast.error(error, { id: toastId });
    } else if (success) {
      toast.success("Deleted", { id: toastId });
      onDeleted?.();
    } else {
      toast.dismiss(toastId);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className={cn(label ? "w-full justify-start gap-2" : "w-fit", className)}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          {label ? <span>{label}</span> : null}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this image?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the record from your gallery. The file on Apimart may
            still expire per their policy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteGenerationJob;
