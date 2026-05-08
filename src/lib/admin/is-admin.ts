import type { User } from "@supabase/supabase-js";

/**
 * 管理员判定（与 middleware、服务端 requireAdmin 保持一致）：
 * 1) JWT `app_metadata.is_admin === true`（需在 Supabase Dashboard 或服务端写入 app_metadata）
 * 2) 或当前用户邮箱在环境变量 ADMIN_EMAILS 中（逗号分隔，大小写不敏感）
 *
 * 勿使用 NEXT_PUBLIC 暴露白名单；ADMIN_EMAILS 仅服务端 / Edge middleware 可读。
 */
export function isAdminUser(user: User | null): boolean {
    if (!user?.email) return false;
    if (user.app_metadata?.is_admin === true) return true;

    const raw = process.env.ADMIN_EMAILS ?? "";
    const allowed = new Set(
        raw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
    );
    return allowed.has(user.email.toLowerCase());
}
