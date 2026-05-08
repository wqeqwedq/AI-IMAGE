"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RedeemCodeResult =
    | { ok: true; points: number }
    | { ok: false; error: string; message?: string };

export async function redeemCodeAction(rawCode: string): Promise<RedeemCodeResult> {
    const supabase = await createServer();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { ok: false, error: "not_authenticated" };
    }

    const { data, error } = await supabase.rpc("redeem_ai_image_code", {
        p_code: rawCode,
    });

    if (error) {
        return { ok: false, error: "rpc_error", message: error.message };
    }

    const payload = data as { ok?: boolean; error?: string; points?: number } | null;
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "rpc_error" };
    }

    if (payload.ok === true && typeof payload.points === "number") {
        revalidatePath("/billing");
        revalidatePath("/dashboard");
        return { ok: true, points: payload.points };
    }

    const err = typeof payload.error === "string" ? payload.error : "unknown";
    return { ok: false, error: err };
}
