import { prisma } from './db';
import { PLAN_LIMITS, recordOverage } from './stripe';

export async function trackCall(businessId: string): Promise<{ allowed: boolean; remaining: number; overage: boolean }> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error('Business not found');

  // Check if we need to reset the billing period
  const now = new Date();
  if (now > business.currentPeriodEnd) {
    // Reset period
    const newPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // If there was overage last period, create invoice item
    if (business.overageCalls > 0) {
      await recordOverage(businessId, business.overageCalls);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        callsThisPeriod: 0,
        overageCalls: 0,
      },
    });

    business.callsThisPeriod = 0;
    business.overageCalls = 0;
  }

  const limit = PLAN_LIMITS[business.plan].calls;
  const totalCalls = business.callsThisPeriod + business.overageCalls;

  if (limit === Infinity) {
    await prisma.business.update({
      where: { id: businessId },
      data: { callsThisPeriod: { increment: 1 } },
    });
    return { allowed: true, remaining: Infinity, overage: false };
  }

  if (totalCalls < limit) {
    await prisma.business.update({
      where: { id: businessId },
      data: { callsThisPeriod: { increment: 1 } },
    });
    return { allowed: true, remaining: limit - totalCalls - 1, overage: false };
  }

  // Over limit - still allow but track overage
  await prisma.business.update({
    where: { id: businessId },
    data: { overageCalls: { increment: 1 } },
  });

  return { allowed: true, remaining: 0, overage: true };
}

export async function getUsageStats(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return null;

  const limit = PLAN_LIMITS[business.plan].calls;
  const totalCalls = business.callsThisPeriod + business.overageCalls;

  return {
    plan: business.plan,
    planName: PLAN_LIMITS[business.plan].name,
    limit: limit === Infinity ? 'Unlimited' : limit,
    used: totalCalls,
    remaining: limit === Infinity ? 'Unlimited' : Math.max(0, limit - totalCalls),
    overageCalls: business.overageCalls,
    overageCost: business.overageCalls * 0.35,
    periodStart: business.currentPeriodStart,
    periodEnd: business.currentPeriodEnd,
  };
}
