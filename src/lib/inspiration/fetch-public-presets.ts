import type { createServer } from "@/lib/supabase/server";
import { sanitizeInspirationSearch } from "@/lib/inspiration/categories";
import {
    buildPresetCategoryTree,
    type PresetCategoryTree,
} from "@/lib/presets/build-preset-category-tree";

type Client = Awaited<ReturnType<typeof createServer>>;

/** 公开预设中出现过的一级 → 二级列表（来自 DB 聚合，供 /models 筛选与 URL 校验） */
export type PublicPresetCategoryTree = PresetCategoryTree;

export type InspirationFilters = {
  primary?: string;
  secondary?: string;
  q?: string;
};

/**
 * 从公开预设聚合一级 / 二级类目；一级、二级各自按 zh-Hans 排序便于浏览。
 */
export async function fetchPublicPresetCategoryTree(
  supabase: Client
): Promise<PublicPresetCategoryTree> {
  const { data, error } = await supabase
    .from("presets")
    .select("primary_category, secondary_category")
    .eq("is_public", true);

  if (error || !data?.length) {
    return {};
  }

  return buildPresetCategoryTree(data);
}

export function parseInspirationSearchParams(
  sp: Record<string, string | string[] | undefined>,
  categoryTree: PublicPresetCategoryTree
): InspirationFilters {
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const primary = raw("primary")?.trim();
  const secondary = raw("secondary")?.trim();
  const q = raw("q")?.trim();

  const p =
    primary && Object.prototype.hasOwnProperty.call(categoryTree, primary)
      ? primary
      : undefined;
  const s =
    p &&
    secondary &&
    (categoryTree[p]?.includes(secondary) ?? false)
      ? secondary
      : undefined;

  return {
    primary: p,
    secondary: s,
    q: q || undefined,
  };
}

export async function fetchPublicPresetsForInspiration(
  supabase: Client,
  filters: InspirationFilters
) {
  let q = supabase
    .from("presets")
    .select("*")
    .eq("is_public", true);

  if (filters.primary) {
    q = q.eq("primary_category", filters.primary);
  }
  if (filters.secondary) {
    q = q.eq("secondary_category", filters.secondary);
  }

  const term = sanitizeInspirationSearch(filters.q);
  if (term) {
    const wild = `%${term}%`;
    q = q.or(`title.ilike.${wild},prompt.ilike.${wild}`);
  }

  const { data, error } = await q.order("likes", { ascending: false });
  return { data: data ?? [], error };
}
