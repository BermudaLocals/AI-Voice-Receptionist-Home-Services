import { google } from 'googleapis';
import { decrypt } from './encryption';
import { prisma } from './db';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getGoogleAuthUrl(businessId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    state: businessId,
    prompt: 'consent',
  });
}

export async function exchangeGoogleCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getGoogleCalendarClient(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.googleRefreshToken) return null;

  oauth2Client.setCredentials({
    refresh_token: decrypt(business.googleRefreshToken),
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function checkAvailability(
  businessId: string,
  date: Date,
  durationMinutes: number = 60
): Promise<Array<{ start: Date; end: Date }>> {
  const calendar = await getGoogleCalendarClient(businessId);
  if (!calendar) {
    // Return default business hours slots if no calendar connected
    return getDefaultSlots(date, durationMinutes);
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const calendarId = business?.googleCalendarId || 'primary';

  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(18, 0, 0, 0);

  const response = await calendar.events.list({
    calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  const busySlots = events.map(e => ({
    start: new Date(e.start?.dateTime || e.start?.date || ''),
    end: new Date(e.end?.dateTime || e.end?.date || ''),
  }));

  return findFreeSlots(dayStart, dayEnd, busySlots, durationMinutes);
}

export async function createCalendarEvent(
  businessId: string,
  booking: {
    customerName: string;
    customerPhone: string;
    serviceName: string;
    scheduledDate: Date;
    duration: number;
    notes?: string;
    address?: string;
  }
) {
  const calendar = await getGoogleCalendarClient(businessId);
  if (!calendar) return null;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const calendarId = business?.googleCalendarId || 'primary';

  const endDate = new Date(booking.scheduledDate);
  endDate.setMinutes(endDate.getMinutes() + booking.duration);

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `${booking.serviceName} - ${booking.customerName}`,
      description: `Phone: ${booking.customerPhone}\n${booking.notes || ''}\nAddress: ${booking.address || 'TBD'}`,
      start: {
        dateTime: booking.scheduledDate.toISOString(),
        timeZone: business?.timezone || 'America/New_York',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: business?.timezone || 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'sms', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  });

  return event.data.id;
}

function getDefaultSlots(date: Date, duration: number): Array<{ start: Date; end: Date }> {
  const slots = [];
  for (let hour = 8; hour < 17; hour++) {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    slots.push({ start, end });
  }
  return slots;
}

function findFreeSlots(
  dayStart: Date,
  dayEnd: Date,
  busySlots: Array<{ start: Date; end: Date }>,
  duration: number
): Array<{ start: Date; end: Date }> {
  const freeSlots = [];
  let current = new Date(dayStart);

  for (const busy of busySlots) {
    if (current < busy.start) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      if (slotEnd <= busy.start) {
        freeSlots.push({ start: new Date(current), end: slotEnd });
      }
    }
    current = new Date(Math.max(current.getTime(), busy.end.getTime()));
  }

  // Check remaining time after last busy slot
  const finalEnd = new Date(current);
  finalEnd.setMinutes(finalEnd.getMinutes() + duration);
  if (finalEnd <= dayEnd) {
    freeSlots.push({ start: new Date(current), end: finalEnd });
  }

  return freeSlots;
}
