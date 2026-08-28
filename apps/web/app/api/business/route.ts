import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/auth';
import { businessSettingsSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Business API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const validated = businessSettingsSchema.partial().parse(body);

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: validated,
      include: { services: true },
    });

    return NextResponse.json({ business: updated });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
