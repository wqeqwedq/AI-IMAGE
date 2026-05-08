import { AdminRedeemCodesPanel } from "@/components/admin/admin-redeem-codes-panel";
import { listRedeemCodes } from "@/lib/admin/redeem-codes-service";
import { getTranslations } from "next-intl/server";

export default async function AdminRedeemCodesPage() {
    const t = await getTranslations("admin.pages.redeemCodes");
    const initial = await listRedeemCodes({
        pointsFilter: "all",
        statusFilter: "all",
        page: 1,
        pageSize: 20,
    });

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <AdminRedeemCodesPanel
                initialRows={initial.rows}
                initialTotal={initial.total}
            />
        </div>
    );
}
