import { getTranslations } from "next-intl/server";

export default async function AdminHomePage() {
    const t = await getTranslations("admin.pages.overview");

    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </div>
    );
}
