/** 列表/轮播用较小宽度，经 next/image 优化；原图 URL 单独传给下载与大图预览 */
export type ImageDisplayVariant = "thumbnail" | "preview" | "full";

export const IMAGE_DISPLAY_WIDTHS: Record<ImageDisplayVariant, number> = {
  thumbnail: 384,
  preview: 768,
  full: 1920,
};

export function imageQualityForVariant(variant: ImageDisplayVariant): number {
  switch (variant) {
    case "thumbnail":
      return 55;
    case "preview":
      return 70;
    case "full":
      return 85;
  }
}

export function sizesForVariant(variant: ImageDisplayVariant): string {
  switch (variant) {
    case "thumbnail":
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
    case "preview":
      return "(max-width: 1024px) calc(100vw - 4rem), min(66vw, 900px)";
    case "full":
      return "min(96vw, 1280px)";
  }
}

/** 确保为可传给 next/image 的绝对 URL */
export function normalizeOriginalImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed;
}
