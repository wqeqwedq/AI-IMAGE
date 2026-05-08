import { getCreditsAction } from "@/app/actions/credits-action";
import PlanSummarry from "@/components/billing/plan-summary";
import { RedeemCodeCard } from "@/components/billing/redeem-code-card";
import Pricing from "@/components/billing/pricing";
import Title from "@/components/billing/title";
import {
  getProducts,
  getRedeemPurchaseLinks,
  getSubscription,
  getUser,
} from "@/lib/supabase/queries";
import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

const BillingPage = async () => {
  const supabase = await createServer();
  const [user, products, subscription, redeemPurchaseLinks] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase),
    getRedeemPurchaseLinks(supabase),
  ]);
  if (!user) {
    return redirect("/login");
  }
  const { data: credits } = await getCreditsAction();
  return (
    <section className="container mx-auto">
      <Title />
      <div className="grid gap-10">
        <RedeemCodeCard purchaseLinks={redeemPurchaseLinks} />
        <PlanSummarry
          credits={credits}
          subscription={subscription}
          user={user}
          products={products || []}
        />
        {subscription?.status === "active" && (
          <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
            showInterval={false}
            className={"!p-0 max-w-full"}
            activeProduct={
              subscription.prices?.products?.name?.toLowerCase() ?? "pro"
            }
          />
        )}
      </div>
    </section>
  );
};

export default BillingPage;
