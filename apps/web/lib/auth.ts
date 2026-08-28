import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBusinessByClerkOrgId, createBusiness } from './db';

export async function getCurrentBusiness() {
  const { orgId } = auth();

  if (!orgId) {
    return null;
  }

  let business = await getBusinessByClerkOrgId(orgId);

  // Auto-create business on first visit if not exists
  if (!business) {
    const user = await currentUser();
    if (!user) return null;

    const primaryEmail = user.emailAddresses[0]?.emailAddress;
    if (!primaryEmail) return null;

    business = await createBusiness({
      clerkOrgId: orgId,
      name: user.firstName ? `${user.firstName}'s Business` : 'My Business',
      phone: '',
      email: primaryEmail,
    });
  }

  return business;
}

export async function requireAuth() {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }
  return userId;
}

export async function requireBusiness() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect('/onboarding');
  }
  return business;
}
