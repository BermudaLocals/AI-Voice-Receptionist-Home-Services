import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const outcome = searchParams.get('outcome');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { businessId: business.id };
    if (status) where.status = status;
    if (outcome) where.outcome = outcome;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { booking: true },
      }),
      prisma.call.count({ where }),
    ]);

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Calls API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
