import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeGoogleCode, encrypt } from '@/lib/encryption';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const businessId = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`);
    }

    if (!code || !businessId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`);
    }

    const tokens = await exchangeGoogleCode(code);

    if (tokens.refresh_token) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          googleRefreshToken: encrypt(tokens.refresh_token),
          googleCalendarId: tokens.access_token ? 'primary' : undefined,
        },
      });
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=success`);
  } catch (error) {
    console.error('Calendar callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`);
  }
}
