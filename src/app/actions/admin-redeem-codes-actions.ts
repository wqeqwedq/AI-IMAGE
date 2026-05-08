"use server";

import {
    exportRedeemCodesTxt,
    generateRedeemCodes,
    listRedeemCodes,
    type ListRedeemCodesParams,
} from "@/lib/admin/redeem-codes-service";
import { revalidatePath } from "next/cache";

export async function adminGenerateRedeemCodesAction(
    points: number,
    count: number
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
    try {
        const inserted = await generateRedeemCodes(points, count);
        revalidatePath("/admin/redeem-codes");
        return { ok: true, inserted };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}

export async function adminListRedeemCodesAction(
    params: ListRedeemCodesParams
) {
    return listRedeemCodes(params);
}

export async function adminExportRedeemCodesTxtAction(params: {
    pointsFilter: "all" | number;
    statusFilter: "all" | "unused" | "used";
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
    try {
        const text = await exportRedeemCodesTxt(params);
        return { ok: true, text };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}
