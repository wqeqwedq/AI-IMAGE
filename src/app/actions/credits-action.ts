import { createServer } from "@/lib/supabase/server";
import { Tables } from "@datatypes.types";


interface CreditResponse {
    error: string | null;
    success: boolean;
    data: Tables<"ai_image_credits"> | null;
}

export async function getCreditsAction(): Promise<CreditResponse> {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: creditsData, error } = await supabase.from("ai_image_credits").select("*").eq("user_id", user?.id).single();

    if (error) {
        return {
            error: error?.message || null,
            success: false,
            data: null
        }
    }

    const hold = creditsData.credit_hold ?? 0;
    const bank = creditsData.image_generation_count ?? 0;
    /** 可立即用于新开任务的次数 = 已入账剩余 − 进行中任务冻结 */
    const available = Math.max(0, bank - hold);

    return {
        error: null,
        success: true,
        data: {
            ...creditsData,
            image_generation_count: available,
        },
    }

}