"use client";

import * as React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ImageLightboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 数据库 / Apimart 原始地址；用原生 img 避免经 _next/image 代理 */
  imageUrl: string;
  prompt: string;
  /** 无障碍标题（可来自翻译） */
  title: string;
  /** 文案：复制、已复制 */
  copyLabel: string;
  copiedToast: string;
  /** 可选：画廊下载、删除等 */
  footerExtra?: React.ReactNode;
  /** 无提示词时的占位 */
  emptyPromptLabel: string;
  /** imageUrl 为空时展示（勿对原生 img 传 src=""） */
  emptyImageLabel?: string;
  /** 仅放大图片：不展示提示词、复制等底部信息 */
  imageOnly?: boolean;
};

export function ImageLightboxDialog({
  open,
  onOpenChange,
  imageUrl,
  prompt,
  title,
  copyLabel,
  copiedToast,
  footerExtra,
  emptyPromptLabel,
  emptyImageLabel = "No image URL",
  imageOnly = false,
}: ImageLightboxDialogProps) {
  const displayPrompt = prompt.trim() ? prompt : emptyPromptLabel;
  const safeImageSrc = imageUrl.trim();

  const copyPrompt = async () => {
    const text = prompt.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(copiedToast);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
          "gap-0 overflow-hidden border bg-card p-0 shadow-2xl sm:rounded-lg",
          imageOnly
            ? "max-h-[min(98dvh,960px)] w-[min(98vw,960px)] max-w-[min(98vw,960px)]"
            : "max-h-[min(96dvh,920px)] w-[min(96vw,900px)] max-w-[min(96vw,900px)]"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "flex flex-col",
            imageOnly
              ? "max-h-[min(96dvh,940px)]"
              : "max-h-[min(92dvh,880px)]"
          )}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 items-center justify-center bg-muted/30",
              imageOnly ? "p-1 sm:p-2" : "p-2 sm:p-3"
            )}
          >
            {safeImageSrc ? (
              /* 原生 img：浏览器请求的就是 result_url，不会变成 /_next/image?... */
              <img
                src={safeImageSrc}
                alt=""
                className={cn(
                  "max-w-full object-contain",
                  imageOnly
                    ? "max-h-[min(92dvh,920px)]"
                    : "max-h-[min(72dvh,780px)]"
                )}
                decoding="async"
              />
            ) : (
              <p className="max-w-md text-center text-sm text-muted-foreground">{emptyImageLabel}</p>
            )}
          </div>

          {!imageOnly ? (
            <div className="shrink-0 space-y-3 border-t bg-background px-4 py-3">
              <p className="max-h-32 overflow-y-auto text-sm leading-relaxed text-muted-foreground break-words whitespace-pre-wrap">
                {displayPrompt}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!prompt.trim()}
                  onClick={() => void copyPrompt()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copyLabel}
                </Button>
                {footerExtra}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
