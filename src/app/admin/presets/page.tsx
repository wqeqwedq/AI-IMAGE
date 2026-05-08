import { AdminPresetsPanel } from "@/components/admin/admin-presets-panel";
import { listAdminPresets } from "@/lib/admin/presets-service";
import { getTranslations } from "next-intl/server";

export default async function AdminPresetsPage() {
    const t = await getTranslations("admin.pages.presets");
    const initial = await listAdminPresets({
        visibility: "all",
        titleSearch: "",
        primaryCategory: "",
        page: 1,
        pageSize: 15,
    });

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <AdminPresetsPanel initialRows={initial.rows} initialTotal={initial.total} />
        </div>
    );
}
