"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { GenerationJobGalleryItem } from "@/app/actions/image-action";
import JobImageDialog from "./job-image-dialog";

interface GalleryProps {
  items: GenerationJobGalleryItem[];
}

const GalleryComponent = ({ items }: GalleryProps) => {
  const [selected, setSelected] = useState<GenerationJobGalleryItem | null>(
    null
  );
  const galleryT = useTranslations("gallery");

  if (items.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        {galleryT("emptyJobs")}
      </div>
    );
  }

  return (
    <section className="container mx-auto py-8">
      <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {items.map((item) => (
          <div key={item.id} className="break-inside-avoid">
            <button
              type="button"
              className="group w-full cursor-zoom-in overflow-hidden rounded-lg border bg-card text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setSelected(item)}
              aria-label={galleryT("viewLarge")}
            >
              <div className="relative aspect-square w-full bg-muted">
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-opacity duration-200 group-hover:bg-black/50 group-hover:opacity-100">
                  <span className="px-2 text-center text-sm font-medium text-white">
                    {galleryT("viewLarge")}
                  </span>
                </div>
                <Image
                  src={item.url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </button>
          </div>
        ))}
      </div>
      {selected ? (
        <JobImageDialog item={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
};

export default GalleryComponent;
