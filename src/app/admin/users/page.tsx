import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
    const t = await getTranslations("admin.pages.users");

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <AdminUsersPanel />
        </div>
    );
}
