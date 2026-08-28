import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/auth';
import { serviceSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const services = await prisma.service.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const validated = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        ...validated,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
