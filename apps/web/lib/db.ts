import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper to ensure business context in queries
export async function getBusinessByClerkOrgId(clerkOrgId: string) {
  return prisma.business.findUnique({
    where: { clerkOrgId },
    include: {
      services: { where: { isActive: true } },
      users: true,
    },
  });
}

export async function getBusinessById(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      services: { where: { isActive: true } },
      users: true,
    },
  });
}

export async function createBusiness(data: {
  clerkOrgId: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
}) {
  return prisma.business.create({
    data: {
      ...data,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    },
  });
}
