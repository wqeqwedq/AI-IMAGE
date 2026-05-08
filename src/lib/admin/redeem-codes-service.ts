import "server-only";

import type { Tables, TablesInsert } from "@datatypes.types";
import { randomRedeemCode } from "@/lib/redeem-code-random";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./require-admin";

const CODE_LENGTH = 20;
const MAX_GENERATE = 500;
const MAX_EXPORT = 10_000;

export type RedeemCodeRow = Tables<"ai_image_redeem_codes">;

export type ListRedeemCodesParams = {
    pointsFilter: "all" | number;
    statusFilter: "all" | "unused" | "used";
    page: number;
    pageSize: number;
};

export type ListRedeemCodesResult = {
    rows: RedeemCodeRow[];
    total: number;
};

export async function listRedeemCodes(
    params: ListRedeemCodesParams
): Promise<ListRedeemCodesResult> {
    await requireAdmin();

    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(10, params.pageSize));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseAdmin
        .from("ai_image_redeem_codes")
        .select("*", { count: "exact" });

    if (params.statusFilter !== "all") {
        q = q.eq("status", params.statusFilter);
    }
    if (params.pointsFilter !== "all") {
        q = q.eq("points", params.pointsFilter);
    }

    q = q.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await q;

    if (error) {
        throw new Error(error.message);
    }

    return {
        rows: (data ?? []) as RedeemCodeRow[],
        total: count ?? 0,
    };
}

/**
 * 生成固定 20 位兑换码；冲突（含库内已存在）则重试下一条。
 */
export async function generateRedeemCodes(points: number, count: number): Promise<number> {
    await requireAdmin();

    if (!Number.isFinite(points) || points < 1 || points > 1_000_000) {
        throw new Error("invalid_points");
    }
    if (!Number.isFinite(count) || count < 1 || count > MAX_GENERATE) {
        throw new Error("invalid_count");
    }

    let inserted = 0;
    let attempts = 0;
    const maxAttempts = count * 80;

    while (inserted < count && attempts < maxAttempts) {
        attempts++;
        const code = randomRedeemCode(CODE_LENGTH);
        const row: TablesInsert<"ai_image_redeem_codes"> = {
            code,
            points,
            status: "unused",
            expire_at: null,
        };
        const { error } = await supabaseAdmin.from("ai_image_redeem_codes").insert(row);
        if (!error) {
            inserted++;
            continue;
        }
        if (error.code === "23505") {
            continue;
        }
        throw new Error(error.message);
    }

    if (inserted < count) {
        throw new Error("generate_incomplete");
    }

    return inserted;
}

export async function exportRedeemCodesTxt(params: {
    pointsFilter: "all" | number;
    statusFilter: "all" | "unused" | "used";
}): Promise<string> {
    await requireAdmin();

    let q = supabaseAdmin
        .from("ai_image_redeem_codes")
        .select("code")
        .order("created_at", { ascending: false })
        .limit(MAX_EXPORT);

    if (params.statusFilter !== "all") {
        q = q.eq("status", params.statusFilter);
    }
    if (params.pointsFilter !== "all") {
        q = q.eq("points", params.pointsFilter);
    }

    const { data, error } = await q;

    if (error) {
        throw new Error(error.message);
    }

    const lines = (data ?? []).map((r) => r.code).filter(Boolean);
    return lines.join("\n");
}
