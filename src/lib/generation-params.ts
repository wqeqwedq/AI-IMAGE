import { z } from "zod";

/** 与项目根目录「请求参数」说明一致，供 Edge Function / 前端表单共用 */
export const GPT_IMAGE_MODEL = "gpt-image-2" as const;

/** 下拉可扩展；当前接口固定为 gpt-image-2 */
export const GENERATION_MODEL_OPTIONS = [
  { id: "gpt-image-2", labelZh: "GPT Image 2", labelEn: "GPT Image 2" },
] as const;

export const SIZE_OPTIONS = [
  "auto",
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "5:4",
  "4:5",
  "16:9",
  "9:16",
  "2:1",
  "1:2",
  "21:9",
  "9:21",
] as const;

export const RESOLUTION_OPTIONS = ["1k", "2k", "4k"] as const;

/** 生图扣费：与 DB 函数 `ai_image_start_generation_job` 保持一致 */
export function generationCreditsForResolution(resolution: string): 1 | 2 | 3 {
  const r = resolution.trim().toLowerCase();
  if (r === "1k") return 1;
  if (r === "2k") return 2;
  if (r === "4k") return 3;
  return 1;
}

/** 请求参数：4K 仅支持这 6 种 size（表中 4K 列非 ❌） */
export const SIZE_OPTIONS_4K_COMPATIBLE = new Set([
  "16:9",
  "9:16",
  "2:1",
  "1:2",
  "21:9",
  "9:21",
]);

/** 切换到 4K 且当前 size 不兼容时的默认比例 */
export const DEFAULT_SIZE_FOR_4K_RESOLUTION = "16:9" as const;

/** 请求参数：选 4K 时不可与 auto、1:1、3:2、2:3、4:3、3:4、5:4、4:5 等组合（表中 4K 为 ❌） */
export function isSizeIncompatibleWith4kResolution(size: string): boolean {
  return !SIZE_OPTIONS_4K_COMPATIBLE.has(size);
}

export function isResolutionCompatibleWithSize(
  size: string,
  resolution: string
): boolean {
  if (resolution !== "4k") return true;
  return SIZE_OPTIONS_4K_COMPATIBLE.has(size);
}

export type GenerationParams = {
  model: string;
  prompt: string;
  n: number;
  size: string;
  resolution: string;
  image_urls: string[];
};

export const defaultGenerationParams = (): GenerationParams => ({
  model: GPT_IMAGE_MODEL,
  prompt: "",
  n: 1,
  size: "1:1",
  resolution: "1k",
  image_urls: [],
});

const sizeSet = new Set<string>(SIZE_OPTIONS as unknown as string[]);
const resSet = new Set<string>(RESOLUTION_OPTIONS as unknown as string[]);

export const generationParamsSchema = z
  .object({
    model: z.string().min(1),
    prompt: z.string(),
    n: z.coerce.number().int().min(1).max(1),
    size: z.string().refine((s) => sizeSet.has(s), "invalid size"),
    resolution: z.string().refine((s) => resSet.has(s), "invalid resolution"),
    image_urls: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (!isResolutionCompatibleWithSize(data.size, data.resolution)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "resolution 4k is incompatible with size",
        path: ["resolution"],
      });
    }
  });

export function parseGenerationParams(raw: unknown): GenerationParams {
  const base = defaultGenerationParams();
  if (!raw || typeof raw !== "object") {
    return generationParamsSchema.parse(base);
  }
  const o = raw as Record<string, unknown>;
  const merged = {
    ...base,
    ...o,
    image_urls: Array.isArray(o.image_urls)
      ? (o.image_urls as string[])
      : base.image_urls,
  };
  let parsed = generationParamsSchema.safeParse(merged);
  if (parsed.success) return parsed.data;
  if (
    typeof merged.resolution === "string" &&
    merged.resolution === "4k" &&
    typeof merged.size === "string" &&
    isSizeIncompatibleWith4kResolution(merged.size)
  ) {
    parsed = generationParamsSchema.safeParse({
      ...merged,
      resolution: "2k",
    });
    if (parsed.success) return parsed.data;
  }
  return base;
}

export function imageUrlsFromTextarea(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 16);
}

export function textareaFromImageUrls(urls: string[] | undefined): string {
  return (urls ?? []).join("\n");
}
