"use client";

import { useLocale, useTranslations } from "next-intl";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GenerationJobGalleryItem } from "@/app/actions/image-action";
import DeleteGenerationJob from "./delete-generation-job";

type JobImageDialogProps = {
  item: GenerationJobGalleryItem;
  onClose: () => void;
};

/** 若线上语言包未同步新 key，避免 MISSING_MESSAGE（不改 JSON 时的兜底） */
function galleryLabel(
  t: { has: (key: string) => boolean; (key: string): string },
  locale: string,
  key: "promptLabel" | "deleteImage"
): string {
  if (typeof t.has === "function" && t.has(key)) return t(key);
  const zh = locale === "zh" || locale.startsWith("zh-");
  if (key === "promptLabel") return zh ? "提示词" : "Prompt";
  return zh ? "删除图片" : "Delete image";
}

const JobImageDialog = ({ item, onClose }: JobImageDialogProps) => {
  const locale = useLocale();
  const galleryT = useTranslations("gallery");
  const displayPrompt = item.prompt.trim() ? item.prompt : galleryT("noPrompt");

  const copyPrompt = async () => {
    const text = item.prompt.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(galleryT("copiedPrompt"));
    } catch {
      toast.error(galleryT("copyFailed"));
    }
  };

  const handleDownload = () => {
    fetch(item.url)
      .then((r) => r.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `generated-${item.id}.png`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "left-[50%] top-[50%] z-50 flex max-h-[min(92dvh,880px)] w-[min(96vw,1280px)] max-w-[min(96vw,1280px)] translate-x-[-50%] translate-y-[-50%]",
          "flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl lg:flex-row"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{galleryT("viewLarge")}</DialogTitle>
        </DialogHeader>

        {/* 左栏约 2/3：点击空白（非图片像素区域）关闭 */}
        <div
          role="presentation"
          className={cn(
            "flex min-h-[min(42dvh,360px)] w-full cursor-default items-center justify-center bg-black/80 p-4 sm:p-6",
            "lg:min-h-[min(80dvh,820px)] lg:w-2/3 lg:rounded-l-[calc(0.75rem-1px)]"
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <img
            src={item.url}
            alt=""
            decoding="async"
            className={cn(
              "max-h-[min(72dvh,760px)] max-w-full object-contain shadow-2xl",
              "rounded-xl ring-1 ring-white/10"
            )}
          />
        </div>

        {/* 右栏约 1/3：功能面板 */}
        <aside
          className={cn(
            "flex max-h-[min(50dvh,480px)] min-h-0 w-full flex-col gap-4 overflow-y-auto border-t border-border/60 bg-card p-4 sm:p-5",
            "lg:max-h-none lg:w-1/3 lg:border-l lg:border-t-0 lg:rounded-r-[calc(0.75rem-1px)]"
          )}
        >
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {galleryLabel(galleryT, locale, "promptLabel")}
            </p>
            <p className="max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground/90 break-words whitespace-pre-wrap lg:max-h-64">
              {displayPrompt}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start gap-2"
              disabled={!item.prompt.trim()}
              onClick={() => void copyPrompt()}
            >
              <Copy className="h-4 w-4 shrink-0" />
              {galleryT("copyPrompt")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 shrink-0" />
              {galleryT("download")}
            </Button>
            <DeleteGenerationJob
              jobId={item.id}
              onDeleted={onClose}
              className="w-full"
              label={galleryLabel(galleryT, locale, "deleteImage")}
            />
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
};

export default JobImageDialog;
