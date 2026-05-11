"use server";

import {
    searchUserCreditsByEmail,
    updateUserCredits,
    type UserCreditsView,
} from "@/lib/admin/users-service";

export async function adminSearchUserByEmailAction(
    email: string
): Promise<
    | { ok: true; data: UserCreditsView }
    | { ok: false; error: "invalid_email" | "not_found" | string }
> {
    try {
        const result = await searchUserCreditsByEmail(email);
        if ("error" in result) {
            return { ok: false, error: result.error };
        }
        return { ok: true, data: result };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}

export async function adminUpdateUserCreditsAction(input: {
    userId: string;
    image_generation_count: number;
    max_image_generation_count: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        await updateUserCredits(input);
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}
