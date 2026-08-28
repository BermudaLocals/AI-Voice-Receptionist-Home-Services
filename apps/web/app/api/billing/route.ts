import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentBusiness } from '@/lib/auth';
import { getUsageStats } from '@/lib/usage';
import { stripe, createStripeCustomer, createSubscription, PLAN_LIMITS } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const usage = await getUsageStats(business.id);

    // Get Stripe subscription details if exists
    let subscriptionDetails = null;
    if (business.stripeSubscriptionId) {
      try {
        subscriptionDetails = await stripe.subscriptions.retrieve(business.stripeSubscriptionId);
      } catch (e) {
        console.error('Failed to fetch subscription:', e);
      }
    }

    return NextResponse.json({
      business: {
        plan: business.plan,
        planStatus: business.planStatus,
        trialEndsAt: business.trialEndsAt,
        reviewAddonEnabled: business.reviewAddonEnabled,
      },
      usage,
      subscription: subscriptionDetails ? {
        currentPeriodStart: new Date(subscriptionDetails.current_period_start * 1000),
        currentPeriodEnd: new Date(subscriptionDetails.current_period_end * 1000),
        cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
      } : null,
      plans: Object.entries(PLAN_LIMITS).map(([key, value]) => ({
        id: key,
        name: value.name,
        price: value.price / 100,
        calls: value.calls === Infinity ? 'Unlimited' : value.calls,
      })),
    });
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
