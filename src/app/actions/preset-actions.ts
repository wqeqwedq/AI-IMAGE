"use server";

import type { Json } from "@datatypes.types";
import { createServer } from "@/lib/supabase/server";
import {
  parseGenerationParams,
  type GenerationParams,
} from "@/lib/generation-params";
import {
  DEFAULT_PRIMARY_CATEGORY,
  DEFAULT_SECONDARY_CATEGORY,
} from "@/lib/inspiration/categories";

export async function createUserPresetAction(
  title: string,
  params: GenerationParams
): Promise<{ success: boolean; error: string | null }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: "Title is required" };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const payload = parseGenerationParams(params);

  const { error } = await supabase.from("presets").insert({
    user_id: user.id,
    title: trimmed,
    cover_image: null,
    prompt: payload.prompt,
    negative_prompt: "",
    model: payload.model,
    params: payload as unknown as Json,
    is_public: false,
    likes: 0,
    forks: 0,
    primary_category: DEFAULT_PRIMARY_CATEGORY,
    secondary_category: DEFAULT_SECONDARY_CATEGORY,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

export async function updateUserPresetAction(
  id: string,
  title: string,
  params: GenerationParams
): Promise<{ success: boolean; error: string | null }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: "Title is required" };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const payload = parseGenerationParams(params);

  const { error } = await supabase
    .from("presets")
    .update({
      title: trimmed,
      prompt: payload.prompt,
      model: payload.model,
      params: payload as unknown as Json,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

const PRESET_REFS_BUCKET = "ai_image_preset_refs";

export async function uploadPresetReferenceFilesAction(
  formData: FormData
): Promise<{ urls: string[]; paths: string[]; error: string | null }> {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { urls: [], paths: [], error: "Unauthorized" };
  }

  const raw = formData.getAll("files");
  const files = raw.filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { urls: [], paths: [], error: null };
  }

  const urls: string[] = [];
  const paths: string[] = [];
  for (const file of files) {
    const safeBase = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const ext =
      safeBase.includes(".") ? safeBase.split(".").pop() || "bin" : "bin";
    const path = `${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(PRESET_REFS_BUCKET)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      return { urls: [], paths: [], error: upErr.message };
    }

    const { data: pub } = supabase.storage
      .from(PRESET_REFS_BUCKET)
      .getPublicUrl(path);
    urls.push(pub.publicUrl);
    paths.push(path);
  }

  return { urls, paths, error: null };
}

export async function deleteUserPresetAction(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("presets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}
