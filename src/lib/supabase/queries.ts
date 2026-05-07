import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;
});

export const getSubscription = cache(async (supabase: SupabaseClient) => {
    const { data: row } = await supabase
        .from('ai_image_subscriptions')
        .select('*, ai_image_prices(*, ai_image_products(*))')
        .in('status', ['trialing', 'active'])
        .maybeSingle();

    if (!row) return null;

    const price = (row as { ai_image_prices?: Record<string, unknown> | null })
        .ai_image_prices;
    const { ai_image_prices: _p, ...rest } = row as Record<string, unknown> & {
        ai_image_prices?: { ai_image_products?: unknown } | null;
    };

    return {
        ...rest,
        prices: price
            ? {
                  ...price,
                  products: (price as { ai_image_products?: unknown })
                      .ai_image_products,
              }
            : null,
    };
});

export const getProducts = cache(async (supabase: SupabaseClient) => {
    const { data: rows } = await supabase
        .from('ai_image_products')
        .select('*, ai_image_prices(*)')
        .eq('active', true)
        .eq('ai_image_prices.active', true)
        .order('id')
        .order('unit_amount', { referencedTable: 'ai_image_prices' });

    return (rows ?? []).map(
        ({ ai_image_prices, ...product }: { ai_image_prices?: unknown[] }) => ({
            ...product,
            prices: ai_image_prices ?? [],
        })
    );
});

export const getUserDetails = cache(async (supabase: SupabaseClient) => {
    const { data: userDetails } = await supabase
        .from('ai_image_users')
        .select('*')
        .single();
    return userDetails;
});