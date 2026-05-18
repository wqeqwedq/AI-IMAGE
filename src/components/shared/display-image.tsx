"use client";

import Image from "next/image";
import { useState } from "react";
import {
  type ImageDisplayVariant,
  imageQualityForVariant,
  normalizeOriginalImageUrl,
  sizesForVariant,
} from "@/lib/display-image";
import { cn } from "@/lib/utils";

export type DisplayImageProps = {
  /** 数据库 / Apimart / Storage 原图地址；下载与大图预览应使用同一地址 */
  originalUrl: string;
  alt: string;
  variant?: ImageDisplayVariant;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** next/image 优化失败时回退为直连原图（blob: 预览请继续用原生 img） */
  fallbackToOriginal?: boolean;
};

export function DisplayImage({
  originalUrl,
  alt,
  variant = "thumbnail",
  fill = true,
  width,
  height,
  className,
  priority = false,
  fallbackToOriginal = true,
}: DisplayImageProps) {
  const src = normalizeOriginalImageUrl(originalUrl);
  const [useFallback, setUseFallback] = useState(false);

  if (!src) return null;

  if (useFallback && fallbackToOriginal) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          fill ? "absolute inset-0 h-full w-full object-cover" : className
        )}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  const quality = imageQualityForVariant(variant);
  const sizes = sizesForVariant(variant);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        quality={quality}
        priority={priority}
        onError={() => {
          if (fallbackToOriginal) setUseFallback(true);
        }}
      />
    );
  }

  const w = width ?? 640;
  const h = height ?? Math.max(1, Math.round(w * 0.75));

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      sizes={sizes}
      quality={quality}
      priority={priority}
      onError={() => {
        if (fallbackToOriginal) setUseFallback(true);
      }}
    />
  );
}
