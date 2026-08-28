import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      thisMonthCalls,
      lastMonthCalls,
      thisMonthBookings,
      lastMonthBookings,
      thisMonthRevenue,
      lastMonthRevenue,
      outcomeBreakdown,
      dailyStats,
    ] = await Promise.all([
      prisma.call.count({
        where: { businessId: business.id, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      prisma.call.count({
        where: { businessId: business.id, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.call.count({
        where: { businessId: business.id, outcome: 'BOOKED', createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      prisma.call.count({
        where: { businessId: business.id, outcome: 'BOOKED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.call.aggregate({
        where: { businessId: business.id, createdAt: { gte: thisMonthStart, lte: thisMonthEnd }, revenue: { not: null } },
        _sum: { revenue: true },
      }),
      prisma.call.aggregate({
        where: { businessId: business.id, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, revenue: { not: null } },
        _sum: { revenue: true },
      }),
      prisma.call.groupBy({
        by: ['outcome'],
        where: { businessId: business.id, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        _count: { id: true },
      }),
      prisma.call.groupBy({
        by: ['createdAt'],
        where: { businessId: business.id, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        _count: { id: true },
        _sum: { revenue: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({
      callsThisMonth: thisMonthCalls,
      callsLastMonth: lastMonthCalls,
      callsChange: lastMonthCalls > 0 ? ((thisMonthCalls - lastMonthCalls) / lastMonthCalls * 100).toFixed(1) : 0,
      bookingsThisMonth: thisMonthBookings,
      bookingsLastMonth: lastMonthBookings,
      bookingsChange: lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1) : 0,
      revenueThisMonth: thisMonthRevenue._sum.revenue || 0,
      revenueLastMonth: lastMonthRevenue._sum.revenue || 0,
      revenueChange: (lastMonthRevenue._sum.revenue || 0) > 0 
        ? (((thisMonthRevenue._sum.revenue || 0) - (lastMonthRevenue._sum.revenue || 0)) / (lastMonthRevenue._sum.revenue || 1) * 100).toFixed(1) 
        : 0,
      outcomeBreakdown: outcomeBreakdown.map(o => ({
        outcome: o.outcome,
        count: o._count.id,
      })),
      dailyStats: dailyStats.map(d => ({
        date: d.createdAt.toISOString().split('T')[0],
        calls: d._count.id,
        revenue: d._sum.revenue || 0,
      })),
    });
  } catch (error) {
    console.error('Call stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
