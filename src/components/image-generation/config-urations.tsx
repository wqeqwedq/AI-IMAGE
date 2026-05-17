"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Info, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import useGeneratedStore from "@/store/useGeneratedStore.ts";
import { useTranslations } from "next-intl";
import {
  GPT_IMAGE_MODEL,
  SIZE_OPTIONS,
  DEFAULT_SIZE_FOR_4K_RESOLUTION,
  isSizeIncompatibleWith4kResolution,
  RESOLUTION_OPTIONS,
  imageUrlsFromTextarea,
  isResolutionCompatibleWithSize,
  parseGenerationParams,
  textareaFromImageUrls,
} from "@/lib/generation-params";
import type { UserPresetRow } from "@/lib/presets/queries";
import { uploadPresetReferenceFilesAction } from "@/app/actions/preset-actions";

interface ConfiguratinsPros {
  userPresets: UserPresetRow[];
}

export const PRESET_NONE_VALUE = "__none__";

const MAX_REF_IMAGES = 16;

function mergeRefUrls(
  textarea: string,
  uploaded: string[],
  max: number
): string[] | null {
  const lines = textarea
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of [...lines, ...uploaded]) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length > max) return null;
  }
  return out;
}

function RefPreviewSlide({
  previewUrl,
  onRemove,
  removeLabel,
}: {
  previewUrl: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="relative flex h-full w-full min-w-0 items-center justify-center overflow-hidden rounded-md bg-muted/30">
      <img
        src={previewUrl}
        alt=""
        className="max-h-full max-w-full object-contain"
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-1 top-1 z-10 h-7 w-7 shrink-0 rounded-full shadow-sm"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PendingRefPreviews({
  previewUrls,
  onRemoveAt,
  removeLabel,
}: {
  previewUrls: string[];
  onRemoveAt: (index: number) => void;
  removeLabel: string;
}) {
  if (previewUrls.length === 0) return null;

  if (previewUrls.length === 1) {
    return (
      <RefPreviewSlide
        previewUrl={previewUrls[0]}
        onRemove={() => onRemoveAt(0)}
        removeLabel={removeLabel}
      />
    );
  }

  return (
    <Carousel className="relative h-full w-full min-w-0 px-7 [&>div:first-child]:h-full">
      <CarouselContent className="ml-0 h-full">
        {previewUrls.map((url, index) => (
          <CarouselItem
            key={`${url}-${index}`}
            className="h-full min-h-0 basis-full pl-0"
          >
            <RefPreviewSlide
              previewUrl={url}
              onRemove={() => onRemoveAt(index)}
              removeLabel={removeLabel}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 top-1/2 h-7 w-7 -translate-y-1/2 border-border/60 bg-background/90" />
      <CarouselNext className="right-0 top-1/2 h-7 w-7 -translate-y-1/2 border-border/60 bg-background/90" />
    </Carousel>
  );
}

export const ImageGenerationFormSchema = () => {
  const formSchemaT = useTranslations("imageGeneration.formSchema");
  return z
    .object({
      preset_id: z.string({ required_error: formSchemaT("preset") }),
      prompt: z.string(),
      size: z.string({ required_error: formSchemaT("size") }),
      resolution: z.string({ required_error: formSchemaT("resolution") }),
      image_urls_text: z.string().optional().default(""),
    })
    .superRefine((data, ctx) => {
      if (!data.prompt.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: formSchemaT("promptEmpty"),
          path: ["prompt"],
        });
      }
      const urls = imageUrlsFromTextarea(data.image_urls_text ?? "");
      if (urls.length > MAX_REF_IMAGES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: formSchemaT("imageUrlsMax"),
          path: ["image_urls_text"],
        });
      }
      if (!isResolutionCompatibleWithSize(data.size, data.resolution)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: formSchemaT("resolution4kSize"),
          path: ["resolution"],
        });
      }
    });
};

export type ImageGenerationFormValues = z.infer<
  ReturnType<typeof ImageGenerationFormSchema>
>;

/** 与「请求参数」一致的请求体 + 前端 preset 选择 */
export type GenerateImageSubmitPayload = {
  preset_id: string;
  model: typeof GPT_IMAGE_MODEL;
  prompt: string;
  n: 1;
  size: string;
  resolution: string;
  image_urls: string[];
  /** 本次会话新上传、任务提交后可从桶中删除的参考图路径 */
  cleanup_ref_paths?: string[];
};

const defaultFormValues = (): ImageGenerationFormValues => ({
  preset_id: PRESET_NONE_VALUE,
  prompt: "",
  size: "1:1",
  resolution: "1k",
  image_urls_text: "",
});

function applyPresetRowToValues(row: UserPresetRow): ImageGenerationFormValues {
  const p = parseGenerationParams(row.params);
  let resolution = p.resolution;
  let size = p.size;
  if (resolution === "4k" && isSizeIncompatibleWith4kResolution(size)) {
    size = DEFAULT_SIZE_FOR_4K_RESOLUTION;
  }
  if (!isResolutionCompatibleWithSize(size, resolution)) {
    resolution = "2k";
  }
  return {
    preset_id: row.id,
    prompt: p.prompt,
    size,
    resolution,
    image_urls_text: textareaFromImageUrls(p.image_urls),
  };
}

const Configurations = ({ userPresets }: ConfiguratinsPros) => {
  const generateImageStore = useGeneratedStore((state) => state.generateImage);
  const settingsT = useTranslations("imageGeneration.settings");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRefFiles, setPendingRefFiles] = useState<File[]>([]);

  const form = useForm<ImageGenerationFormValues>({
    resolver: zodResolver(ImageGenerationFormSchema()),
    defaultValues: defaultFormValues(),
  });

  const watchedResolution = useWatch({
    control: form.control,
    name: "resolution",
    defaultValue: "1k",
  });

  const previewUrls = useMemo(
    () => pendingRefFiles.map((file) => URL.createObjectURL(file)),
    [pendingRefFiles]
  );

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  const onSubmit = async (values: ImageGenerationFormValues) => {
    const uniqueLines = new Set(
      values.image_urls_text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    );
    if (uniqueLines.size > MAX_REF_IMAGES) {
      toast.error(settingsT("refLimitToast"));
      return;
    }
    if (pendingRefFiles.length > MAX_REF_IMAGES) {
      toast.error(settingsT("refLimitToast"));
      return;
    }

    let uploadedUrls: string[] = [];
    let uploadedPaths: string[] = [];
    if (pendingRefFiles.length > 0) {
      const fd = new FormData();
      for (const f of pendingRefFiles) {
        fd.append("files", f);
      }
      const { urls, paths, error } = await uploadPresetReferenceFilesAction(fd);
      if (error) {
        toast.error(error ?? settingsT("uploadRefsFailed"));
        return;
      }
      uploadedUrls = urls;
      uploadedPaths = paths;
    }

    const merged = mergeRefUrls(
      values.image_urls_text ?? "",
      uploadedUrls,
      MAX_REF_IMAGES
    );
    if (merged === null) {
      toast.error(settingsT("refLimitToast"));
      return;
    }

    const payload: GenerateImageSubmitPayload = {
      preset_id: values.preset_id,
      model: GPT_IMAGE_MODEL,
      prompt: values.prompt.trim(),
      n: 1,
      size: values.size,
      resolution: values.resolution,
      image_urls: merged,
      ...(uploadedPaths.length > 0
        ? { cleanup_ref_paths: uploadedPaths }
        : {}),
    };
    await generateImageStore(payload);
    setPendingRefFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    form.setValue("image_urls_text", textareaFromImageUrls(merged));
  };

  const applyPresetById = (presetId: string) => {
    setPendingRefFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (presetId === PRESET_NONE_VALUE) {
      form.reset(defaultFormValues());
      return;
    }
    const row = userPresets.find((p) => p.id === presetId);
    if (!row) {
      form.setValue("preset_id", PRESET_NONE_VALUE);
      return;
    }
    form.reset(applyPresetRowToValues(row));
  };

  const onPickRefFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setPendingRefFiles((prev) => [...prev, ...Array.from(list)]);
    e.target.value = "";
  };

  const removePendingRefAt = (index: number) => {
    setPendingRefFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col lg:h-full">
      <TooltipProvider>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 w-full min-w-0 max-w-full flex-col"
          >
            <fieldset className="grid min-h-0 w-full min-w-0 max-w-full flex-1 gap-6 overflow-x-hidden overflow-y-auto rounded-lg border bg-background p-4">
            <legend className="text-sm -ml-1 px-1 font-medium">
              {settingsT("name")}
            </legend>

            <FormField
              control={form.control}
              name="preset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    {settingsT("presetPicker")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{settingsT("presetPickerInfo")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      applyPresetById(v);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={settingsT("presetPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PRESET_NONE_VALUE}>
                        {settingsT("presetNone")}
                      </SelectItem>
                      {userPresets.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{settingsT("fieldModel")}</FormLabel>
              <Input readOnly value={GPT_IMAGE_MODEL} className="bg-muted" />
            </FormItem>

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{settingsT("prompt")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{settingsT("fieldSize")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={settingsT("fieldSize")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SIZE_OPTIONS.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            disabled={
                              watchedResolution === "4k" &&
                              isSizeIncompatibleWith4kResolution(s)
                            }
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{settingsT("fieldResolution")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === "4k") {
                          const sz = form.getValues("size");
                          if (isSizeIncompatibleWith4kResolution(sz)) {
                            form.setValue("size", DEFAULT_SIZE_FOR_4K_RESOLUTION);
                          }
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={settingsT("fieldResolution")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_urls_text"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{settingsT("fieldRefImages")}</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {settingsT("fieldRefImagesHint")}
                  </p>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      className="max-w-full break-all"
                      placeholder={settingsT("fieldRefImagesPlaceholder")}
                    />
                  </FormControl>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onPickRefFiles}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {settingsT("pickRefImages")}
                    </Button>
                  </div>
                  <div
                    className="h-36 w-full min-w-0 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/10 p-2"
                    aria-live="polite"
                  >
                    <PendingRefPreviews
                      previewUrls={previewUrls}
                      onRemoveAt={removePendingRefAt}
                      removeLabel={settingsT("removePendingRef")}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>
          <Button
            type="submit"
            className="mt-4 h-10 w-full shrink-0 font-medium"
          >
            {settingsT("generate")}
          </Button>
        </form>
      </Form>
    </TooltipProvider>
    </div>
  );
};

export default Configurations;
