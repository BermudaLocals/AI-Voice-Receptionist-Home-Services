import Stripe from 'stripe';
import { prisma } from './db';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const PLAN_LIMITS = {
  STARTER: { calls: 100, price: 14900, name: 'Starter' },
  PROFESSIONAL: { calls: 300, price: 29900, name: 'Professional' },
  ENTERPRISE: { calls: Infinity, price: 59900, name: 'Enterprise' },
};

export const OVERAGE_RATE = 35; // $0.35 in cents

export async function createStripeCustomer(businessId: string, email: string, name: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { businessId },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

export async function createSubscription(businessId: string, plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || !business.stripeCustomerId) {
    throw new Error('Business or Stripe customer not found');
  }

  const priceKey = `STRIPE_PRICE_${plan}` as const;
  const priceId = process.env[priceKey];
  if (!priceId) throw new Error(`Price ID not configured for plan ${plan}`);

  const subscription = await stripe.subscriptions.create({
    customer: business.stripeCustomerId,
    items: [{ price: priceId }],
    metadata: { businessId },
    trial_period_days: business.trialEndsAt && business.trialEndsAt > new Date() 
      ? Math.ceil((business.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined,
  });

  await prisma.business.update({
    where: { id: businessId },
    data: {
      stripeSubscriptionId: subscription.id,
      plan,
      planStatus: 'ACTIVE',
    },
  });

  return subscription;
}

export async function recordOverage(businessId: string, callCount: number) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || !business.stripeCustomerId) return;

  const amount = callCount * OVERAGE_RATE;

  await stripe.invoiceItems.create({
    customer: business.stripeCustomerId,
    amount,
    currency: 'usd',
    description: `Overage: ${callCount} calls @ $0.35/call`,
    metadata: { businessId, callCount },
  });
}

export async function getOrCreateSubscription(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error('Business not found');

  if (business.stripeSubscriptionId) {
    return stripe.subscriptions.retrieve(business.stripeSubscriptionId);
  }

  return createSubscription(businessId, business.plan);
}
