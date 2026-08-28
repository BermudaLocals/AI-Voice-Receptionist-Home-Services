import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Webhook } from 'svix';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const headers = {
      'svix-id': req.headers.get('svix-id') || '',
      'svix-timestamp': req.headers.get('svix-timestamp') || '',
      'svix-signature': req.headers.get('svix-signature') || '',
    };

    const wh = new Webhook(webhookSecret);
    const event = wh.verify(JSON.stringify(payload), headers) as any;

    switch (event.type) {
      case 'organization.created': {
        const org = event.data;
        await prisma.business.create({
          data: {
            clerkOrgId: org.id,
            name: org.name,
            phone: '',
            email: '',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
        break;
      }

      case 'organization.updated': {
        const org = event.data;
        await prisma.business.update({
          where: { clerkOrgId: org.id },
          data: { name: org.name },
        });
        break;
      }

      case 'organizationMembership.created': {
        const membership = event.data;
        await prisma.businessUser.create({
          data: {
            businessId: (await prisma.business.findUnique({
              where: { clerkOrgId: membership.organization.id },
            }))!.id,
            clerkUserId: membership.public_user_data.user_id,
            email: membership.public_user_data.email_address,
            name: `${membership.public_user_data.first_name || ''} ${membership.public_user_data.last_name || ''}`.trim(),
            role: membership.role === 'admin' ? 'ADMIN' : 'MEMBER',
          },
        });
        break;
      }

      case 'organizationMembership.deleted': {
        const membership = event.data;
        await prisma.businessUser.deleteMany({
          where: { clerkUserId: membership.public_user_data.user_id },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
