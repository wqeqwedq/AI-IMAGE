import { AdminAnnouncementsPanel } from "@/components/admin/admin-announcements-panel";
import { listAnnouncementsAdmin } from "@/lib/admin/announcements-service";
import { getTranslations } from "next-intl/server";

export default async function AdminAnnouncementsPage() {
    const t = await getTranslations("admin.pages.announcements");
    const rows = await listAnnouncementsAdmin();

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <AdminAnnouncementsPanel initialRows={rows} />
        </div>
    );
}
