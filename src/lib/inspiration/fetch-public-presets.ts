import type { createServer } from "@/lib/supabase/server";
import {
  isKnownPrimary,
  isValidCategoryPair,
  sanitizeInspirationSearch,
} from "@/lib/inspiration/categories";

type Client = Awaited<ReturnType<typeof createServer>>;

export type InspirationFilters = {
  primary?: string;
  secondary?: string;
  q?: string;
};

export function parseInspirationSearchParams(
  sp: Record<string, string | string[] | undefined>
): InspirationFilters {
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const primary = raw("primary")?.trim();
  const secondary = raw("secondary")?.trim();
  const q = raw("q")?.trim();

  const p =
    primary && isKnownPrimary(primary) ? primary : undefined;
  const s =
    p && secondary && isValidCategoryPair(p, secondary)
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
