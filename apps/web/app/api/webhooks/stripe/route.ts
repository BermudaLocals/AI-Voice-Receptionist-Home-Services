import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.businessId;

        if (businessId) {
          const planMap: Record<string, any> = {
            [process.env.STRIPE_PRICE_STARTER!]: 'STARTER',
            [process.env.STRIPE_PRICE_PROFESSIONAL!]: 'PROFESSIONAL',
            [process.env.STRIPE_PRICE_ENTERPRISE!]: 'ENTERPRISE',
          };

          const priceId = subscription.items.data[0]?.price.id;
          const plan = planMap[priceId] || 'STARTER';

          await prisma.business.update({
            where: { id: businessId },
            data: {
              stripeSubscriptionId: subscription.id,
              planStatus: subscription.status.toUpperCase() as any,
              plan,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.businessId;

        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              planStatus: 'CANCELED',
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const businessId = invoice.metadata?.businessId || 
          (await stripe.customers.retrieve(invoice.customer as string)).metadata?.businessId;

        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { planStatus: 'PAST_DUE' },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const businessId = invoice.metadata?.businessId;

        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { planStatus: 'ACTIVE' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
