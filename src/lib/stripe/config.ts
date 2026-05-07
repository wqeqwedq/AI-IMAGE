import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/** Lazy init so `next build` does not require Stripe keys unless code paths run. */
export function getStripe(): Stripe {
    if (!stripeInstance) {
        const apiKey =
            process.env.STRIPE_SECRET_KEY_LIVE ??
            process.env.STRIPE_SECRET_KEY ??
            '';
        if (!apiKey.trim()) {
            throw new Error(
                'Stripe is not configured: set STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_LIVE) in environment variables.'
            );
        }
        stripeInstance = new Stripe(apiKey, {
            typescript: true,
        });
    }
    return stripeInstance;
}

/** Same client as `getStripe()`; forwards property access for existing imports. */
export const stripe: Stripe = new Proxy({} as Stripe, {
    get(_target, prop, receiver) {
        const client = getStripe();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === 'function'
            ? (value as (...args: unknown[]) => unknown).bind(client)
            : value;
    },
});
