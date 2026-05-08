import "server-only";

import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "./is-admin";

/**
 * 服务端路由 / Server Action 入口必须调用：未登录或非管理员一律 redirect。
 * 所有管理员写操作也应在此之后或使用 service role + 再次校验。
 */
export async function requireAdmin() {
    const supabase = await createServer();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?next=/admin");
    }
    if (!isAdminUser(user)) {
        redirect("/dashboard");
    }

    return user;
}
