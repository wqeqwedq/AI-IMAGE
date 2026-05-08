"use server";

import {
    createAdminPreset,
    deleteAdminPreset,
    listAdminPresets,
    type AdminPresetRow,
    type CreateAdminPresetInput,
    type ListAdminPresetsParams,
    type ListAdminPresetsResult,
    updateAdminPreset,
    type UpdateAdminPresetInput,
} from "@/lib/admin/presets-service";

export async function adminListPresetsAction(
    params: ListAdminPresetsParams
): Promise<ListAdminPresetsResult> {
    return listAdminPresets(params);
}

export async function adminCreatePresetAction(
    input: CreateAdminPresetInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    try {
        const { id } = await createAdminPreset(input);
        return { ok: true, id };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        if (msg === "title_required") return { ok: false, error: "title_required" };
        if (msg === "invalid_categories") return { ok: false, error: "invalid_categories" };
        if (msg === "category_too_long") return { ok: false, error: "category_too_long" };
        if (msg.startsWith("invalid_generation:")) {
            return { ok: false, error: msg.slice("invalid_generation:".length).trim() || "invalid_generation" };
        }
        return { ok: false, error: msg };
    }
}

export async function adminUpdatePresetAction(
    input: UpdateAdminPresetInput
): Promise<
    | { ok: true }
    | {
          ok: false;
          error:
              | "title_required"
              | "invalid_categories"
              | "category_too_long"
              | "not_found"
              | "platform_must_stay_public"
              | string;
      }
> {
    try {
        await updateAdminPreset(input);
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        if (msg === "title_required") return { ok: false, error: "title_required" };
        if (msg === "invalid_categories") return { ok: false, error: "invalid_categories" };
        if (msg === "category_too_long") return { ok: false, error: "category_too_long" };
        if (msg === "not_found") return { ok: false, error: "not_found" };
        if (msg === "platform_must_stay_public")
            return { ok: false, error: "platform_must_stay_public" };
        return { ok: false, error: msg };
    }
}

export async function adminDeletePresetAction(
    id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        await deleteAdminPreset(id);
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}

export type { AdminPresetRow, ListAdminPresetsParams };
