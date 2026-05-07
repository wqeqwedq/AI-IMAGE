import type { Tables } from "@datatypes.types";

type ProductRow = Tables<"ai_image_products">;
type PriceRow = Tables<"ai_image_prices">;
type SubscriptionRow = Tables<"ai_image_subscriptions">;

export interface ProductWithPrices extends ProductRow {
  prices: PriceRow[];
}

export interface PriceWithProduct extends PriceRow {
  products: ProductRow | null;
}

export interface SubscriptionWithProduct extends SubscriptionRow {
  prices: PriceWithProduct | null;
}
