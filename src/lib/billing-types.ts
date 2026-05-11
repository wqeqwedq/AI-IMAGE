import type { Tables } from "@datatypes.types";

type ProductRow = Tables<"ai_image_products">;
type PriceRow = Tables<"ai_image_prices">;

export interface ProductWithPrices extends ProductRow {
  prices: PriceRow[];
}
