"use server";

import { Stripe } from "stripe";
import { checkAuth } from "@/app/auth/login/actions";
import { createOrRetrieveCustomer } from "@/utils/actions/stripe/actions";

const apiKey = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(apiKey);

interface NewSessionOptions {
    priceId: string;
    referral?: string | null; // 👈 NEW
}

// Function to create a Stripe Checkout Session
export const postStripeSession = async ({ priceId, referral }: NewSessionOptions) => { // 👈 updated to accept referral
    // Check if user is authenticated
    const { authenticated, user } = await checkAuth();
    
    if (!authenticated || !user?.id || !user?.email) {
        throw new Error('User must be authenticated to create a checkout session');
    }

    try {
        // Get or create Stripe customer
        const customerId = await createOrRetrieveCustomer({
            uuid: user.id,
            email: user.email
        });

      // --- build & create session (REVISED) ---
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
if (!baseUrl?.startsWith("http")) {
  throw new Error("NEXT_PUBLIC_SITE_URL must be a full URL (e.g. https://cyme.ai)");
}

const returnUrl = `${baseUrl}/subscription/checkout-return?session_id={CHECKOUT_SESSION_ID}`;

// Only keep referral if it’s a non-empty string
const normalizedReferral =
  referral && referral.trim().length > 0 ? referral.trim() : undefined;

// Start with params that are always sent
const params: Stripe.Checkout.SessionCreateParams = {
  customer: customerId,
  ui_mode: "embedded",
  line_items: [{ price: priceId, quantity: 1 }],
  mode: "subscription",
  allow_promotion_codes: true,
  return_url: returnUrl,
  // Always tag your internal user id for reconciliation
  metadata: { userId: user.id, ...(normalizedReferral ? { referral: normalizedReferral } : {}) },
};

// Only attach client_reference_id when a real referral exists
if (normalizedReferral) {
  params.client_reference_id = normalizedReferral;
}

const session = await stripe.checkout.sessions.create(params);

if (!session.client_secret) {
  throw new Error('Failed to create Stripe session');
}
        return {
            clientSecret: session.client_secret
        };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create checkout session');
    }
}

// Function to create a Stripe Portal Session
export const createPortalSession = async () => {
    'use server';
    
    // Check if user is authenticated
    const { authenticated, user } = await checkAuth();
    
    if (!authenticated || !user?.id || !user?.email) {
        throw new Error('User must be authenticated to access the billing portal');
    }

    try {
        // Get or create Stripe customer
        const customerId = await createOrRetrieveCustomer({
            uuid: user.id,
            email: user.email
        });

        const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`;

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return {
            url: portalSession.url
        };
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create portal session');
    }
}
