import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentBusiness } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/calendar';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const url = getGoogleAuthUrl(business.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Calendar connect error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
