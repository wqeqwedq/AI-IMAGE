"use client";

import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { Trash2, BookmarkPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  defaultGenerationParams,
  DEFAULT_SIZE_FOR_4K_RESOLUTION,
  GENERATION_MODEL_OPTIONS,
  isSizeIncompatibleWith4kResolution,
  parseGenerationParams,
  RESOLUTION_OPTIONS,
  SIZE_OPTIONS,
  textareaFromImageUrls,
  type GenerationParams,
} from "@/lib/generation-params";
import type { UserPresetRow } from "@/lib/presets/queries";
import {
  createUserPresetAction,
  deleteUserPresetAction,
  updateUserPresetAction,
  uploadPresetReferenceFilesAction,
} from "@/app/actions/preset-actions";

const MAX_IMAGE_URLS = 16;

type FormValues = {
  model: string;
  prompt: string;
  size: string;
  resolution: string;
  image_urls_text: string;
};

function formDefaultsFromParams(p: GenerationParams): FormValues {
  const norm = parseGenerationParams(p);
  return {
    model: norm.model,
    prompt: norm.prompt,
    size: norm.size,
    resolution: norm.resolution,
    image_urls_text: textareaFromImageUrls(norm.image_urls),
  };
}

/** 按「先文本行、后上传 URL」顺序去重；超过 max 条返回 null */
function mergeImageUrlsDedup(
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

function toParams(values: FormValues, image_urls: string[]): GenerationParams {
  return parseGenerationParams({
    model: values.model,
    prompt: values.prompt,
    n: 1,
    size: values.size,
    resolution: values.resolution,
    image_urls,
  });
}

interface PresetsStudioProps {
  presets: UserPresetRow[];
}

export default function PresetsStudio({ presets }: PresetsStudioProps) {
  const t = useTranslations("modelTraining.presetsStudio");
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [presetTitle, setPresetTitle] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const defaultForm = useMemo(
    () => formDefaultsFromParams(defaultGenerationParams()),
    []
  );

  const form = useForm<FormValues>({
    defaultValues: defaultForm,
  });

  const watchedResolution = useWatch({
    control: form.control,
    name: "resolution",
    defaultValue: "1k",
  });

  const modelOptionLabel = (id: string) => {
    const opt = GENERATION_MODEL_OPTIONS.find((o) => o.id === id);
    if (!opt) return id;
    return locale.startsWith("zh") ? opt.labelZh : opt.labelEn;
  };

  const applyUserPreset = (row: UserPresetRow) => {
    const p = parseGenerationParams(row.params);
    form.reset(formDefaultsFromParams(p));
    setEditingPresetId(row.id);
    setPresetTitle(row.title);
    setPendingFiles([]);
    toast.message(t("loadedPreset", { title: row.title }));
  };

  const handleSavePreset = async () => {
    const title = presetTitle.trim();
    if (!title) {
      toast.error(t("titleRequired"));
      return;
    }
    const fv = form.getValues();
    if (!fv.prompt.trim()) {
      toast.error(t("promptRequired"));
      return;
    }

    const lines = fv.image_urls_text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueLines = new Set(lines);
    if (uniqueLines.size > MAX_IMAGE_URLS) {
      toast.error(t("refLimitExceeded"));
      return;
    }
    if (pendingFiles.length > MAX_IMAGE_URLS) {
      toast.error(t("refLimitExceeded"));
      return;
    }

    let uploadedUrls: string[] = [];
    if (pendingFiles.length > 0) {
      const fd = new FormData();
      for (const f of pendingFiles) {
        fd.append("files", f);
      }
      const { urls, error } = await uploadPresetReferenceFilesAction(fd);
      if (error) {
        toast.error(error ?? t("uploadRefsFailed"));
        return;
      }
      uploadedUrls = urls;
    }

    const merged = mergeImageUrlsDedup(
      fv.image_urls_text,
      uploadedUrls,
      MAX_IMAGE_URLS
    );
    if (merged === null) {
      toast.error(t("refLimitExceeded"));
      return;
    }

    const params = toParams(fv, merged);

    if (editingPresetId) {
      const { success, error } = await updateUserPresetAction(
        editingPresetId,
        title,
        params
      );
      if (!success) {
        toast.error(error ?? t("saveFailed"));
        return;
      }
      toast.success(t("updatedPreset"));
    } else {
      const { success, error } = await createUserPresetAction(title, params);
      if (!success) {
        toast.error(error ?? t("saveFailed"));
        return;
      }
      toast.success(t("createdPreset"));
    }

    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    form.setValue("image_urls_text", textareaFromImageUrls(merged));
    router.refresh();
  };

  const handleDeletePreset = async (id: string) => {
    const { success, error } = await deleteUserPresetAction(id);
    if (!success) {
      toast.error(error ?? t("deleteFailed"));
      return;
    }
    toast.success(t("deletedPreset"));
    if (editingPresetId === id) {
      setEditingPresetId(null);
      setPresetTitle("");
      setPendingFiles([]);
      form.reset(defaultForm);
    }
    router.refresh();
  };

  const onPickLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setPendingFiles((prev) => [...prev, ...Array.from(list)]);
    e.target.value = "";
  };

  const removePendingAt = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <BookmarkPlus className="h-5 w-5" />
            {t("myPresets")}
          </h2>
          {presets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noUserPresets")}</p>
          ) : (
            <ul className="space-y-2">
              {presets.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto flex-1 justify-start px-2 py-1 text-left font-normal"
                    onClick={() => applyUserPreset(row)}
                  >
                    <span className="truncate">{row.title}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={t("deletePreset")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("confirmDeleteTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("confirmDeleteDesc", { title: row.title })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePreset(row.id)}
                        >
                          {t("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="lg:col-span-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("formTitle")}</CardTitle>
            {t("formDesc").trim() ? (
              <CardDescription>{t("formDesc")}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="preset-model">{t("fieldModel")}</Label>
                <Controller
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="preset-model" className="w-full">
                        <SelectValue placeholder={t("fieldModelPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {GENERATION_MODEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {modelOptionLabel(opt.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-prompt">{t("fieldPrompt")}</Label>
                <Textarea id="preset-prompt" rows={5} {...form.register("prompt")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preset-size">{t("fieldSize")}</Label>
                  <Controller
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="preset-size" className="w-full">
                          <SelectValue placeholder={t("selectSize")} />
                        </SelectTrigger>
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
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset-resolution">{t("fieldResolution")}</Label>
                  <Controller
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v === "4k") {
                            const sz = form.getValues("size");
                            if (isSizeIncompatibleWith4kResolution(sz)) {
                              form.setValue(
                                "size",
                                DEFAULT_SIZE_FOR_4K_RESOLUTION
                              );
                            }
                          }
                        }}
                      >
                        <SelectTrigger id="preset-resolution" className="w-full">
                          <SelectValue placeholder={t("selectResolution")} />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOLUTION_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-image-urls">{t("fieldImageUrls")}</Label>
                <Textarea
                  id="preset-image-urls"
                  rows={4}
                  placeholder={t("fieldImageUrlsPlaceholder")}
                  {...form.register("image_urls_text")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("fieldLocalRefs")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickLocalFiles}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("pickLocalFiles")}
                  </Button>
                </div>
                {pendingFiles.length > 0 ? (
                  <ul className="space-y-1 rounded-md border p-2 text-sm">
                    {pendingFiles.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-muted-foreground">
                          {f.name}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removePendingAt(i)}
                          aria-label={t("removePendingFile")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="preset-title">{t("presetNameLabel")}</Label>
                <Input
                  id="preset-title"
                  value={presetTitle}
                  onChange={(e) => setPresetTitle(e.target.value)}
                  placeholder={t("presetNamePlaceholder")}
                />
              </div>
              <Button type="button" onClick={handleSavePreset}>
                {editingPresetId ? t("saveUpdate") : t("saveCreate")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
