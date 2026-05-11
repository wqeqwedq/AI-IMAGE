import type { ProductWithPrices } from '@/lib/billing-types';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;
});

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

export type RedeemPurchaseLinkRow = {
    id: string;
    label: string;
    url: string;
    sort_order: number;
};

export const getRedeemPurchaseLinks = cache(
    async (supabase: SupabaseClient): Promise<RedeemPurchaseLinkRow[]> => {
        const { data, error } = await supabase
            .from('ai_image_redeem_purchase_links')
            .select('id, label, url, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            console.error('[getRedeemPurchaseLinks]', error.message);
            return [];
        }

        return (data ?? []) as RedeemPurchaseLinkRow[];
    }
);

export const getUserDetails = cache(async (supabase: SupabaseClient) => {
    const { data: userDetails } = await supabase
        .from('ai_image_users')
        .select('*')
        .single();
    return userDetails;
});