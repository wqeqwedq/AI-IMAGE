"use client";

import type { Tables } from "@datatypes.types";
import React, { useId, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Bookmark, Star } from "lucide-react";
import { toast } from "sonner";

import { collectInspirationPresetAction } from "@/app/actions/inspiration-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type InspirationRow = Tables<"presets">;

function formatCompactCount(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}

interface InspirationGridProps {
  items: InspirationRow[];
  /** 用户是否正在使用分类 / 搜索（用于空状态文案） */
  filteredActive?: boolean;
}

export default function InspirationGrid({
  items,
  filteredActive = false,
}: InspirationGridProps) {
  const t = useTranslations("inspiration");
  const locale = useLocale();
  const router = useRouter();
  const toastId = useId();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  const onCollect = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      toast.loading(t("collecting"), { id: toastId });
      const { success, error, duplicate } = await collectInspirationPresetAction(
        id
      );
      setPendingId(null);
      if (!success) {
        toast.error(error ?? t("collectFailed"), { id: toastId });
        return;
      }
      if (duplicate) {
        toast.info(t("alreadyCollected"), { id: toastId });
        return;
      }
      toast.success(t("collectSuccess"), { id: toastId });
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
        <p className="text-muted-foreground">
          {filteredActive ? t("emptyFiltered") : t("empty")}
        </p>
      </Card>
    );
  }

  return (
    <>
      <Dialog
        open={!!lightboxUrl}
        onOpenChange={(open) => {
          if (!open) setLightboxUrl(null);
        }}
      >
        <DialogContent
          hideClose
          className="max-h-[90vh] max-w-[min(96vw,1200px)] border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:bg-transparent sm:max-w-[min(96vw,1200px)]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{t("lightboxTitle")}</DialogTitle>
          {lightboxUrl ? (
            <div
              className="relative mx-auto flex h-[min(85vh,900px)] w-full min-w-[min(90vw,320px)] items-center justify-center"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* 原生 img：cover_image 可为任意 HTTPS 域名，不经 next/image 白名单 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
                decoding="async"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="group flex flex-col overflow-hidden border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {item.cover_image ? (
                <button
                  type="button"
                  className="absolute inset-0 cursor-zoom-in text-left outline-none ring-offset-background transition-transform duration-300 hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("openPreview")}
                  onClick={() => setLightboxUrl(item.cover_image)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.cover_image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    decoding="async"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  {t("noCover")}
                </div>
              )}
              <div
                className="pointer-events-none absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-[2px]"
                aria-hidden
              >
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-200" />
                <span>
                  {formatCompactCount(item.likes, locale)}
                  {t("likesSuffix")}
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
                  {item.title}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t("collect")}
                  disabled={isPending && pendingId === item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCollect(item.id);
                  }}
                >
                  <Bookmark className="h-6 w-6" strokeWidth={1.75} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    "bg-violet-100 text-violet-800",
                    "dark:bg-violet-950/60 dark:text-violet-200"
                  )}
                >
                  {item.primary_category ?? "—"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    "bg-sky-100 text-sky-800",
                    "dark:bg-sky-950/60 dark:text-sky-200"
                  )}
                >
                  {item.secondary_category ?? "—"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
