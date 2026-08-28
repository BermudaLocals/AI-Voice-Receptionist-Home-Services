import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentBusiness } from '@/lib/auth';
import { stripe, createStripeCustomer } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { plan, addon } = await req.json();

    // Ensure Stripe customer exists
    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const user = await auth();
      const customer = await createStripeCustomer(business.id, business.email, business.name);
      customerId = customer.id;
    }

    const lineItems = [];

    if (plan) {
      const priceKey = `STRIPE_PRICE_${plan}` as const;
      const priceId = process.env[priceKey];
      if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      lineItems.push({ price: priceId, quantity: 1 });
    }

    if (addon === 'reviews') {
      const reviewPriceId = process.env.STRIPE_PRICE_REVIEWS;
      if (reviewPriceId) {
        lineItems.push({ price: reviewPriceId, quantity: 1 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { businessId: business.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
