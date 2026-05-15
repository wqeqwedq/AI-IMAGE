import { AdminPresetsPanel } from "@/components/admin/admin-presets-panel";
import {
    fetchAdminPresetCategoryTree,
    listAdminPresets,
} from "@/lib/admin/presets-service";
import {
    DEFAULT_PRIMARY_CATEGORY,
    DEFAULT_SECONDARY_CATEGORY,
} from "@/lib/inspiration/categories";
import { getTranslations } from "next-intl/server";

export default async function AdminPresetsPage() {
    const t = await getTranslations("admin.pages.presets");
    const categoryTree = await fetchAdminPresetCategoryTree();
    const sortedPrimaries = Object.keys(categoryTree).sort((a, b) =>
        a.localeCompare(b, "zh-Hans-CN")
    );
    const firstWithSecondary = sortedPrimaries.find(
        (p) => (categoryTree[p]?.length ?? 0) > 0
    );
    const defaultCategoryPrimary =
        firstWithSecondary ?? DEFAULT_PRIMARY_CATEGORY;
    const defaultCategorySecondary =
        firstWithSecondary !== undefined
            ? categoryTree[firstWithSecondary]![0]!
            : DEFAULT_SECONDARY_CATEGORY;
    const initialCreateCategoryMode =
        firstWithSecondary !== undefined ? "tree" : "custom";

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
            <AdminPresetsPanel
                initialRows={initial.rows}
                initialTotal={initial.total}
                categoryTree={categoryTree}
                defaultCategoryPrimary={defaultCategoryPrimary}
                defaultCategorySecondary={defaultCategorySecondary}
                initialCreateCategoryMode={initialCreateCategoryMode}
            />
        </div>
    );
}
