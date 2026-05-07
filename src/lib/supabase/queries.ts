import type {
    ProductWithPrices,
    SubscriptionWithProduct,
} from '@/lib/billing-types';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;
});

export const getSubscription = cache(
    async (
        supabase: SupabaseClient
    ): Promise<SubscriptionWithProduct | null> => {
        const { data: row } = await supabase
            .from('ai_image_subscriptions')
            .select('*, ai_image_prices(*, ai_image_products(*))')
            .in('status', ['trialing', 'active'])
            .maybeSingle();

        if (!row) return null;

        const price = (
            row as { ai_image_prices?: Record<string, unknown> | null }
        ).ai_image_prices;
        const { ai_image_prices: _p, ...rest } =
            row as Record<string, unknown> & {
                ai_image_prices?: {
                    ai_image_products?: Record<string, unknown> | null;
                } | null;
            };

        const shaped = {
            ...rest,
            prices: price
                ? {
                      ...price,
                      products:
                          (
                              price as {
                                  ai_image_products?:
                                      | Record<string, unknown>
                                      | null;
                              }
                          ).ai_image_products ?? null,
                  }
                : null,
        };

        return shaped as SubscriptionWithProduct;
    }
);

export const getProducts = cache(
    async (supabase: SupabaseClient): Promise<ProductWithPrices[]> => {
        const { data: rows } = await supabase
            .from('ai_image_products')
            .select('*, ai_image_prices(*)')
            .eq('active', true)
            .eq('ai_image_prices.active', true)
            .order('id')
            .order('unit_amount', { referencedTable: 'ai_image_prices' });

        const list = (rows ?? []).map(
            ({
                ai_image_prices,
                ...product
            }: {
                ai_image_prices?: unknown[];
                [key: string]: unknown;
            }) => ({
                ...product,
                prices: (ai_image_prices ?? []) as ProductWithPrices['prices'],
            })
        );

        return list as ProductWithPrices[];
    }
);

export const getUserDetails = cache(async (supabase: SupabaseClient) => {
    const { data: userDetails } = await supabase
        .from('ai_image_users')
        .select('*')
        .single();
    return userDetails;
});