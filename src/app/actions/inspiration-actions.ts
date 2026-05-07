"use server";

import type { Json } from "@datatypes.types";
import { createServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseGenerationParams } from "@/lib/generation-params";
import {
  DEFAULT_PRIMARY_CATEGORY,
  DEFAULT_SECONDARY_CATEGORY,
} from "@/lib/inspiration/categories";

export async function collectInspirationPresetAction(
  sourcePresetId: string
): Promise<{
  success: boolean;
  error: string | null;
  /** 已收藏过同一条灵感，未再次插入 */
  duplicate?: boolean;
}> {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: source, error: selErr } = await supabase
    .from("presets")
    .select("*")
    .eq("id", sourcePresetId)
    .eq("is_public", true)
    .maybeSingle();

  if (selErr || !source) {
    return { success: false, error: selErr?.message ?? "Inspiration not found" };
  }

  const { data: existing } = await supabase
    .from("presets")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_preset_id", sourcePresetId)
    .maybeSingle();

  if (existing) {
    return { success: true, duplicate: true, error: null };
  }

  const params = parseGenerationParams(source.params);

  const { error: insErr } = await supabase.from("presets").insert({
    user_id: user.id,
    title: source.title,
    cover_image: source.cover_image,
    prompt: source.prompt,
    negative_prompt: source.negative_prompt,
    model: source.model,
    params: params as unknown as Json,
    is_public: false,
    likes: 0,
    forks: 0,
    primary_category: source.primary_category ?? DEFAULT_PRIMARY_CATEGORY,
    secondary_category: source.secondary_category ?? DEFAULT_SECONDARY_CATEGORY,
    source_preset_id: sourcePresetId,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return { success: true, duplicate: true, error: null };
    }
    return { success: false, error: insErr.message };
  }

  try {
    const { data: forkRow } = await supabaseAdmin
      .from("presets")
      .select("forks")
      .eq("id", sourcePresetId)
      .maybeSingle();

    if (forkRow) {
      await supabaseAdmin
        .from("presets")
        .update({ forks: (forkRow.forks ?? 0) + 1 })
        .eq("id", sourcePresetId);
    }
  } catch {
    // Fork counter is best-effort; requires SUPABASE_SERVICE_ROLE_KEY on server.
  }

  return { success: true, error: null };
}
