"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { DisplayImage } from "@/components/shared/display-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ImageLightboxDialog } from "@/components/shared/image-lightbox-dialog";
import useGeneratedStore from "@/store/useGeneratedStore.ts";

const GeneratedImages = () => {
  const images = useGeneratedStore((state) => state.images);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const t = useTranslations("imageGeneration");

  if (images.length === 0) {
    return (
      <Card className="flex min-h-[min(42vh,380px)] w-full flex-1 bg-muted lg:min-h-0">
        <CardContent className="flex flex-1 items-center justify-center p-6">
          <span>{t("generatedImages.name")}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Carousel className="relative flex w-full max-w-none flex-1 flex-col px-9 sm:px-12 lg:min-h-0">
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4">
              <button
                type="button"
                disabled={!(image.url ?? "").trim()}
                className="group flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/20 outline-none ring-offset-background transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 enabled:cursor-zoom-in"
                onClick={() => {
                  const url = (image.url ?? "").trim();
                  if (!url) return;
                  setLightboxUrl(url);
                }}
                aria-label={t("generatedImages.viewFull")}
              >
                <div className="relative mx-auto aspect-square w-full max-w-[min(100%,min(85vh,80rem))]">
                  <DisplayImage
                    originalUrl={image.url}
                    alt={t("generatedImages.alt")}
                    variant="preview"
                    className="object-contain"
                    priority={index === 0}
                  />
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 sm:left-1" />
        <CarouselNext className="right-0 sm:right-1" />
      </Carousel>

      <ImageLightboxDialog
        open={lightboxUrl !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxUrl(null);
        }}
        originalUrl={lightboxUrl ?? ""}
        prompt=""
        title={t("generatedImages.fullTitle")}
        copyLabel={t("generatedImages.copyPrompt")}
        copiedToast={t("generatedImages.copiedPrompt")}
        emptyPromptLabel={t("generatedImages.noPrompt")}
        emptyImageLabel={t("generatedImages.noImage")}
        imageOnly
      />
    </>
  );
};

export default GeneratedImages;
