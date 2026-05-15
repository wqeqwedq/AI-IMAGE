import "server-only";

import type { Json, Tables, TablesInsert, TablesUpdate } from "@datatypes.types";
import {
    defaultGenerationParams,
    generationParamsSchema,
} from "@/lib/generation-params";
import { sanitizeInspirationSearch } from "@/lib/inspiration/categories";
import {
    buildPresetCategoryTree,
    type PresetCategoryTree,
} from "@/lib/presets/build-preset-category-tree";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./require-admin";

export type AdminPresetCategoryTree = PresetCategoryTree;

export type AdminPresetRow = Tables<"presets">;

const ADMIN_CATEGORY_MAX_LEN = 80;

/** 全表 presets 聚合一级 / 二级（含非公开），供管理端下拉与筛选 */
export async function fetchAdminPresetCategoryTree(): Promise<AdminPresetCategoryTree> {
    const { data, error } = await supabaseAdmin
        .from("presets")
        .select("primary_category, secondary_category");

    if (error || !data?.length) {
        return {};
    }

    return buildPresetCategoryTree(data);
}

/** 管理端：允许预定义树以外的类目字符串（与 DB text 列一致） */
export function assertAdminPresetCategories(
    primary: string,
    secondary: string
): { primary_category: string; secondary_category: string } {
    const primary_category = primary.trim();
    const secondary_category = secondary.trim();
    if (!primary_category || !secondary_category) {
        throw new Error("invalid_categories");
    }
    if (
        primary_category.length > ADMIN_CATEGORY_MAX_LEN ||
        secondary_category.length > ADMIN_CATEGORY_MAX_LEN
    ) {
        throw new Error("category_too_long");
    }
    return { primary_category, secondary_category };
}

export type ListAdminPresetsParams = {
    visibility: "all" | "public" | "private" | "platform";
    titleSearch: string;
    primaryCategory: string;
    page: number;
    pageSize: number;
};

export type ListAdminPresetsResult = {
    rows: AdminPresetRow[];
    total: number;
};

export type CreateAdminPresetInput = {
    ownerType: "platform" | "self";
    title: string;
    cover_image: string | null;
    negative_prompt: string;
    primary_category: string;
    secondary_category: string;
    is_public: boolean;
    generation: {
        model: string;
        prompt: string;
        n: number;
        size: string;
        resolution: string;
        image_urls: string[];
    };
};

export async function createAdminPreset(
    input: CreateAdminPresetInput
): Promise<{ id: string }> {
    const admin = await requireAdmin();

    const title = input.title.trim();
    if (!title) {
        throw new Error("title_required");
    }

    const { primary_category, secondary_category } = assertAdminPresetCategories(
        input.primary_category,
        input.secondary_category
    );

    const isPlatform = input.ownerType === "platform";
    const user_id = isPlatform ? null : admin.id;
    const is_public = isPlatform ? true : input.is_public;

    const base = defaultGenerationParams();
    const merged = {
        ...base,
        ...input.generation,
        image_urls: Array.isArray(input.generation.image_urls)
            ? input.generation.image_urls
            : base.image_urls,
    };
    const parsed = generationParamsSchema.safeParse(merged);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ");
        throw new Error(`invalid_generation:${msg}`);
    }

    const neg = input.negative_prompt.trim();
    const cover = input.cover_image?.trim() ? input.cover_image.trim() : null;

    const row: TablesInsert<"presets"> = {
        user_id,
        title,
        cover_image: cover,
        prompt: parsed.data.prompt,
        negative_prompt: neg,
        model: parsed.data.model,
        params: parsed.data as unknown as Json,
        is_public,
        likes: 0,
        forks: 0,
        primary_category,
        secondary_category,
        source_preset_id: null,
    };

    const { data, error } = await supabaseAdmin.from("presets").insert(row).select("id").single();

    if (error) {
        throw new Error(error.message);
    }
    if (!data?.id) {
        throw new Error("insert_failed");
    }

    return { id: data.id };
}

export async function listAdminPresets(
    params: ListAdminPresetsParams
): Promise<ListAdminPresetsResult> {
    await requireAdmin();

    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(10, params.pageSize));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseAdmin.from("presets").select("*", { count: "exact" });

    if (params.visibility === "public") {
        q = q.eq("is_public", true);
    } else if (params.visibility === "private") {
        q = q.eq("is_public", false).not("user_id", "is", null);
    } else if (params.visibility === "platform") {
        q = q.is("user_id", null);
    }

    const primary = params.primaryCategory.trim();
    if (primary) {
        q = q.eq("primary_category", primary);
    }

    const term = sanitizeInspirationSearch(params.titleSearch);
    if (term.length > 0) {
        q = q.ilike("title", `%${term}%`);
    }

    q = q.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await q;

    if (error) {
        throw new Error(error.message);
    }

    return {
        rows: (data ?? []) as AdminPresetRow[],
        total: count ?? 0,
    };
}

export type UpdateAdminPresetInput = {
    id: string;
    title: string;
    is_public: boolean;
    primary_category: string;
    secondary_category: string;
    prompt: string;
    negative_prompt: string;
    cover_image: string | null;
};

export async function updateAdminPreset(input: UpdateAdminPresetInput): Promise<void> {
    await requireAdmin();

    const title = input.title.trim();
    if (!title) {
        throw new Error("title_required");
    }

    const { primary_category, secondary_category } = assertAdminPresetCategories(
        input.primary_category,
        input.secondary_category
    );

    const { data: row, error: fetchErr } = await supabaseAdmin
        .from("presets")
        .select("user_id")
        .eq("id", input.id)
        .maybeSingle();

    if (fetchErr) {
        throw new Error(fetchErr.message);
    }
    if (!row) {
        throw new Error("not_found");
    }

    if (row.user_id === null && !input.is_public) {
        throw new Error("platform_must_stay_public");
    }

    const patch: TablesUpdate<"presets"> = {
        title,
        is_public: input.is_public,
        primary_category,
        secondary_category,
        prompt: input.prompt,
        negative_prompt: input.negative_prompt,
        cover_image: input.cover_image?.trim() ? input.cover_image.trim() : null,
    };

    const { error } = await supabaseAdmin.from("presets").update(patch).eq("id", input.id);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteAdminPreset(id: string): Promise<void> {
    await requireAdmin();

    if (!id) {
        throw new Error("id_required");
    }

    const { error } = await supabaseAdmin.from("presets").delete().eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}
