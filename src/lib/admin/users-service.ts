import "server-only";

import type { Tables, TablesInsert } from "@datatypes.types";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./require-admin";

const LIST_PER_PAGE = 200;
const MAX_PAGES = 50;

export type UserCreditsView = {
    userId: string;
    email: string | null;
    credits: Tables<"ai_image_credits"> | null;
    image: {
        remaining: number;
        maxQuota: number;
        consumed: number | null;
    };
    training: {
        remaining: number;
        maxQuota: number;
        consumed: number | null;
    };
};

function consumedOrNull(maxQuota: number, remaining: number): number | null {
    if (maxQuota <= 0) return null;
    return Math.max(0, maxQuota - remaining);
}

function buildView(user: User, credits: Tables<"ai_image_credits"> | null): UserCreditsView {
    const imgRem = credits?.image_generation_count ?? 0;
    const imgMax = credits?.max_image_generation_count ?? 0;
    const trRem = credits?.model_training_count ?? 0;
    const trMax = credits?.max_model_training_count ?? 0;

    return {
        userId: user.id,
        email: user.email ?? null,
        credits,
        image: {
            remaining: imgRem,
            maxQuota: imgMax,
            consumed: consumedOrNull(imgMax, imgRem),
        },
        training: {
            remaining: trRem,
            maxQuota: trMax,
            consumed: consumedOrNull(trMax, trRem),
        },
    };
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
    const needle = email.trim().toLowerCase();
    if (!needle || !needle.includes("@")) {
        return null;
    }

    let page = 1;
    while (page <= MAX_PAGES) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: LIST_PER_PAGE,
        });

        if (error) {
            throw new Error(error.message);
        }

        const users = data.users ?? [];
        const hit = users.find((u) => (u.email ?? "").toLowerCase() === needle);
        if (hit) return hit;

        if (users.length < LIST_PER_PAGE) break;
        page++;
    }

    return null;
}

export async function searchUserCreditsByEmail(
    email: string
): Promise<UserCreditsView | { error: "invalid_email" | "not_found" }> {
    await requireAdmin();

    const needle = email.trim().toLowerCase();
    if (!needle || !needle.includes("@")) {
        return { error: "invalid_email" };
    }

    const user = await findAuthUserByEmail(needle);
    if (!user) {
        return { error: "not_found" };
    }

    const { data: creditsRow, error } = await supabaseAdmin
        .from("ai_image_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return buildView(user, creditsRow as Tables<"ai_image_credits"> | null);
}

export async function updateUserCredits(params: {
    userId: string;
    image_generation_count: number;
    max_image_generation_count: number;
    model_training_count: number;
    max_model_training_count: number;
}): Promise<void> {
    await requireAdmin();

    const uid = params.userId.trim();
    if (!uid) {
        throw new Error("user_id_required");
    }

    const nums = [
        params.image_generation_count,
        params.max_image_generation_count,
        params.model_training_count,
        params.max_model_training_count,
    ];
    for (const n of nums) {
        if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
            throw new Error("invalid_number");
        }
    }

    const { data: existing } = await supabaseAdmin
        .from("ai_image_credits")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

    const row = {
        image_generation_count: params.image_generation_count,
        max_image_generation_count: params.max_image_generation_count,
        model_training_count: params.model_training_count,
        max_model_training_count: params.max_model_training_count,
    };

    if (existing) {
        const { error } = await supabaseAdmin.from("ai_image_credits").update(row).eq("user_id", uid);
        if (error) {
            throw new Error(error.message);
        }
    } else {
        const insertRow: TablesInsert<"ai_image_credits"> = {
            user_id: uid,
            ...row,
        };
        const { error } = await supabaseAdmin.from("ai_image_credits").insert(insertRow);
        if (error) {
            throw new Error(error.message);
        }
    }
}
