import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getCurrentBusiness } from '@/lib/auth';
import { createCalendarEvent } from '@/lib/calendar';
import { bookingSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await getCurrentBusiness();
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { businessId: business.id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: { call: true },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Bookings API error:', error);
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
    const validated = bookingSchema.parse(body);

    const booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        ...validated,
        scheduledDate: new Date(validated.scheduledDate),
      },
    });

    // Sync to Google Calendar
    try {
      const eventId = await createCalendarEvent(business.id, {
        customerName: booking.customerName || 'Unknown',
        customerPhone: booking.customerPhone,
        serviceName: booking.serviceName,
        scheduledDate: booking.scheduledDate,
        duration: booking.duration,
        notes: booking.notes || undefined,
        address: booking.customerAddress || undefined,
      });

      if (eventId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { googleEventId: eventId },
        });
      }
    } catch (calError) {
      console.error('Calendar sync error:', calError);
      // Don't fail the booking if calendar sync fails
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
