import { RedeemCodeCard } from "@/components/redeem/redeem-code-card";
import { getRedeemPurchaseLinks, getUser } from "@/lib/supabase/queries";
import { createServer } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function RedeemPage() {
    const supabase = await createServer();
    const user = await getUser(supabase);
    if (!user) {
        redirect("/login");
    }
    const [links, t] = await Promise.all([
        getRedeemPurchaseLinks(supabase),
        getTranslations("dashboard.redeemPage"),
    ]);

    return (
        <section className="container mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground mt-2">{t("desc")}</p>
            </div>
            <RedeemCodeCard purchaseLinks={links} />
        </section>
    );
}
